package hedera

import (
	"encoding/json"
	"fmt"
	"time"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

// Deal event type constants. These are the milestone labels written to HCS.
const (
	EventEscrowCreated    = "ESCROW_CREATED"
	EventEscrowFunded     = "ESCROW_FUNDED"
	EventReleaseScheduled = "RELEASE_SCHEDULED"
	EventReleaseSigned    = "RELEASE_SIGNED"
	EventDisputeOpened    = "DISPUTE_OPENED"
	EventDisputeResolved  = "DISPUTE_RESOLVED"
	EventDealClosed       = "DEAL_CLOSED"
	EventNFTMinted        = "NFT_MINTED"
	EventNFTTransferred   = "NFT_TRANSFERRED"
)

type DealEvent struct {
	Type      string            `json:"type"`
	DealID    string            `json:"deal_id"`
	Payload   map[string]string `json:"payload,omitempty"`
	Timestamp string            `json:"timestamp"`
}

func CreateDealTopic(client *hedera.Client, dealID string) (hedera.TopicID, error) {
	operatorKey := client.GetOperatorPublicKey()

	txResponse, err := hedera.NewTopicCreateTransaction().
		SetTopicMemo(fmt.Sprintf("meridian deal: %s", dealID)).
		// Only the platform operator can submit messages to this topic.
		SetSubmitKey(operatorKey).
		Execute(client)
	if err != nil {
		return hedera.TopicID{}, fmt.Errorf("create HCS topic for deal %s: %w", dealID, err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return hedera.TopicID{}, fmt.Errorf("get topic receipt for deal %s: %w", dealID, err)
	}

	return *receipt.TopicID, nil
}

func LogEvent(client *hedera.Client, topicID hedera.TopicID, event DealEvent) error {
	if event.Timestamp == "" {
		event.Timestamp = time.Now().UTC().Format(time.RFC3339)
	}

	msgBytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event %s: %w", event.Type, err)
	}

	txResponse, err := hedera.NewTopicMessageSubmitTransaction().
		SetTopicID(topicID).
		SetMessage(msgBytes).
		Execute(client)
	if err != nil {
		return fmt.Errorf("submit HCS event %s to topic %s: %w", event.Type, topicID, err)
	}

	_, err = txResponse.GetReceipt(client)
	if err != nil {
		return fmt.Errorf("get receipt for HCS event %s: %w", event.Type, err)
	}

	return nil
}

// LogEscrowCreated is a convenience wrapper that logs an ESCROW_CREATED event.
func LogEscrowCreated(client *hedera.Client, topicID hedera.TopicID, dealID, escrowAccountID string) error {
	return LogEvent(client, topicID, DealEvent{
		Type:   EventEscrowCreated,
		DealID: dealID,
		Payload: map[string]string{
			"escrow_account": escrowAccountID,
		},
	})
}

// LogEscrowFunded logs that the buyer has deposited USDC into the escrow account.
func LogEscrowFunded(client *hedera.Client, topicID hedera.TopicID, dealID, txID, amountUSDC string) error {
	return LogEvent(client, topicID, DealEvent{
		Type:   EventEscrowFunded,
		DealID: dealID,
		Payload: map[string]string{
			"transaction_id": txID,
			"amount_usdc":    amountUSDC,
		},
	})
}

// LogReleaseScheduled logs that the platform has created a scheduled release.
func LogReleaseScheduled(client *hedera.Client, topicID hedera.TopicID, dealID, scheduleID string) error {
	return LogEvent(client, topicID, DealEvent{
		Type:   EventReleaseScheduled,
		DealID: dealID,
		Payload: map[string]string{
			"schedule_id": scheduleID,
		},
	})
}

// LogDisputeOpened logs that a dispute has been raised on this deal.
func LogDisputeOpened(client *hedera.Client, topicID hedera.TopicID, dealID, raisedBy string) error {
	return LogEvent(client, topicID, DealEvent{
		Type:   EventDisputeOpened,
		DealID: dealID,
		Payload: map[string]string{
			"raised_by": raisedBy,
		},
	})
}

// LogDisputeResolved logs the outcome of a dispute (release or refund).
func LogDisputeResolved(client *hedera.Client, topicID hedera.TopicID, dealID, outcome, scheduleID string) error {
	return LogEvent(client, topicID, DealEvent{
		Type:   EventDisputeResolved,
		DealID: dealID,
		Payload: map[string]string{
			"outcome":     outcome, // "release" or "refund"
			"schedule_id": scheduleID,
		},
	})
}

// LogDealClosed logs the final closure of a deal.
func LogDealClosed(client *hedera.Client, topicID hedera.TopicID, dealID string) error {
	return LogEvent(client, topicID, DealEvent{
		Type:   EventDealClosed,
		DealID: dealID,
	})
}
