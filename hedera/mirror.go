package hedera

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func mirrorNodeBase(network string) string {
	switch network {
	case "mainnet":
		return "https://mainnet-public.mirrornode.hedera.com/api/v1"
	case "local":
		// hedera-local-node REST mirror node runs on :5551 by default.
		return "http://localhost:5551/api/v1"
	default: // testnet
		return "https://testnet.mirrornode.hedera.com/api/v1"
	}
}

var mirrorClient = &http.Client{Timeout: 10 * time.Second}

func mirrorGet(url string, dest any) error {
	resp, err := mirrorClient.Get(url)
	if err != nil {
		return fmt.Errorf("mirror node GET %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("not found: %s", url)
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("mirror node %s returned %d: %s", url, resp.StatusCode, body)
	}

	return json.NewDecoder(resp.Body).Decode(dest)
}

type AccountInfo struct {
	AccountID string `json:"account"`
	Key       struct {
		Type string `json:"_type"`
		Key  string `json:"key"` // hex-encoded DER public key
	} `json:"key"`
	Balance struct {
		Balance int64 `json:"balance"` // HBAR balance in tinybars
	} `json:"balance"`
}

func GetAccountInfo(network, accountID string) (*AccountInfo, error) {
	var info AccountInfo
	url := fmt.Sprintf("%s/accounts/%s", mirrorNodeBase(network), accountID)
	if err := mirrorGet(url, &info); err != nil {
		return nil, fmt.Errorf("get account info for %s: %w", accountID, err)
	}
	return &info, nil
}

type tokenBalance struct {
	TokenID  string `json:"token_id"`
	Balance  int64  `json:"balance"`
	Decimals int    `json:"decimals"`
}

type tokenBalancesResponse struct {
	Tokens []tokenBalance `json:"tokens"`
}

func GetTokenBalance(network, accountID, tokenID string) (int64, error) {
	url := fmt.Sprintf("%s/accounts/%s/tokens?token.id=%s", mirrorNodeBase(network), accountID, tokenID)
	var resp tokenBalancesResponse
	if err := mirrorGet(url, &resp); err != nil {
		return 0, fmt.Errorf("get token balance for %s/%s: %w", accountID, tokenID, err)
	}

	for _, t := range resp.Tokens {
		if t.TokenID == tokenID {
			return t.Balance, nil
		}
	}

	return 0, nil // account has no balance for this token
}

// IsTokenAssociated returns true if the account has an explicit association with
// the given HTS token (regardless of balance). An unassociated account cannot
// receive token transfers and will cause TOKEN_NOT_ASSOCIATED_TO_ACCOUNT.
func IsTokenAssociated(network, accountID, tokenID string) (bool, error) {
	url := fmt.Sprintf("%s/accounts/%s/tokens?token.id=%s", mirrorNodeBase(network), accountID, tokenID)
	var resp tokenBalancesResponse
	if err := mirrorGet(url, &resp); err != nil {
		return false, fmt.Errorf("check token association for %s/%s: %w", accountID, tokenID, err)
	}
	for _, t := range resp.Tokens {
		if t.TokenID == tokenID {
			return true, nil
		}
	}
	return false, nil
}

func GetUSDCBalance(network, accountID, usdcTokenID string) (float64, error) {
	raw, err := GetTokenBalance(network, accountID, usdcTokenID)
	if err != nil {
		return 0, err
	}
	return float64(raw) / 1e6, nil
}

type TopicMessage struct {
	ConsensusTimestamp string
	Message            []byte
	SequenceNumber     int64
	RunningHash        string
}

type topicMessagesResponse struct {
	Messages []struct {
		ConsensusTimestamp string `json:"consensus_timestamp"`
		Message            string `json:"message"` // base64 string from mirror node
		SequenceNumber     int64  `json:"sequence_number"`
		RunningHash        string `json:"running_hash"`
	} `json:"messages"`
}

func GetTopicMessages(network, topicID string) ([]TopicMessage, error) {
	url := fmt.Sprintf("%s/topics/%s/messages?order=asc&limit=100", mirrorNodeBase(network), topicID)
	var resp topicMessagesResponse
	if err := mirrorGet(url, &resp); err != nil {
		return nil, fmt.Errorf("get topic messages for %s: %w", topicID, err)
	}

	msgs := make([]TopicMessage, 0, len(resp.Messages))
	for _, m := range resp.Messages {
		decoded, _ := base64.StdEncoding.DecodeString(m.Message)
		msgs = append(msgs, TopicMessage{
			ConsensusTimestamp: m.ConsensusTimestamp,
			Message:            decoded,
			SequenceNumber:     m.SequenceNumber,
			RunningHash:        m.RunningHash,
		})
	}

	return msgs, nil
}

func GetDealEvents(network, topicID string) ([]DealEvent, error) {
	msgs, err := GetTopicMessages(network, topicID)
	if err != nil {
		return nil, err
	}

	events := make([]DealEvent, 0, len(msgs))
	for _, m := range msgs {
		var event DealEvent
		if err := json.Unmarshal(m.Message, &event); err != nil {
			continue // skip non-JSON or malformed messages
		}
		events = append(events, event)
	}

	return events, nil
}

type ScheduleInfo struct {
	ScheduleID     string `json:"schedule_id"`
	Memo           string `json:"memo"`
	Executed       string `json:"executed_timestamp"` // empty if not yet executed
	Deleted        string `json:"deleted_timestamp"`  // empty if not deleted
	ExpirationTime string `json:"expiration_time"`
	// Mirror node uses "signatures", not "signatories".
	Signatories []struct {
		PublicKeyPrefix string `json:"public_key_prefix"`
		Type            string `json:"type"`
	} `json:"signatures"`
}

func GetSchedule(network, scheduleID string) (*ScheduleInfo, error) {
	url := fmt.Sprintf("%s/schedules/%s", mirrorNodeBase(network), scheduleID)
	var info ScheduleInfo
	if err := mirrorGet(url, &info); err != nil {
		return nil, fmt.Errorf("get schedule %s: %w", scheduleID, err)
	}
	return &info, nil
}

type scheduledTxResponse struct {
	Transactions []struct {
		Result string `json:"result"`
		Name   string `json:"name"`
	} `json:"transactions"`
}

// GetScheduledTransactionResult fetches the result code of the inner transaction
// that was executed when the given schedule's threshold was met.
//
// executedTimestamp is the value from ScheduleInfo.Executed (e.g. "1234567890.123456789").
// The testnet mirror node does not support a scheduled=true filter, so we query all
// transactions at-or-after the executed_timestamp and pick the first CRYPTOTRANSFER.
//
// Returns the result string (e.g. "SUCCESS", "INSUFFICIENT_TOKEN_BALANCE") or "" if not found.
func GetScheduledTransactionResult(network, executedTimestamp string) (string, error) {
	url := fmt.Sprintf("%s/transactions?timestamp=gte:%s&limit=10&order=asc",
		mirrorNodeBase(network), executedTimestamp)
	var resp scheduledTxResponse
	if err := mirrorGet(url, &resp); err != nil {
		return "", fmt.Errorf("inner tx query (ts>=%s): %w", executedTimestamp, err)
	}
	for _, tx := range resp.Transactions {
		if tx.Name == "CRYPTOTRANSFER" {
			return tx.Result, nil
		}
	}
	return "", nil
}

// GetRecentAccountTransactions returns the most recent transaction results for an
// account, newest first. Used to diagnose scheduled release failures.
// Note: the testnet mirror node account transactions endpoint does not support
// transactiontype filtering; all types are returned and filtered by the caller.
func GetRecentAccountTransactions(network, accountID string, limit int) ([]struct{ Result, Name string }, error) {
	url := fmt.Sprintf("%s/accounts/%s/transactions?order=desc&limit=%d",
		mirrorNodeBase(network), accountID, limit)
	var resp struct {
		Transactions []struct {
			Result string `json:"result"`
			Name   string `json:"name"`
		} `json:"transactions"`
	}
	if err := mirrorGet(url, &resp); err != nil {
		return nil, fmt.Errorf("account tx query for %s: %w", accountID, err)
	}
	out := make([]struct{ Result, Name string }, len(resp.Transactions))
	for i, t := range resp.Transactions {
		out[i] = struct{ Result, Name string }{t.Result, t.Name}
	}
	return out, nil
}
