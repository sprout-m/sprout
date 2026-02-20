package service

import (
	"fmt"

	"github.com/google/uuid"
	sdk "github.com/hashgraph/hedera-sdk-go/v2"
	meridianhedera "github.com/meridian-mkt/hedera"
)

// HederaService wraps the hedera package and exposes the operations the
// API handlers need without leaking SDK types into the handler layer.
type HederaService struct {
	client          *sdk.Client
	network         string
	usdcTokenID     sdk.TokenID
	nftCollectionID sdk.TokenID
	platformPubKey  sdk.PublicKey
	cfg             *meridianhedera.Config
}

// NewHederaService builds an authenticated HederaService from the given config.
func NewHederaService(cfg *meridianhedera.Config) (*HederaService, error) {
	client, err := meridianhedera.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("hedera client: %w", err)
	}

	usdcTokenID, err := sdk.TokenIDFromString(cfg.USDCTokenID)
	if err != nil {
		return nil, fmt.Errorf("invalid USDC token ID %q: %w", cfg.USDCTokenID, err)
	}

	// Derive the platform public key from the operator's actual signing key.
	// This guarantees the key placed in every escrow's 2-of-3 threshold matches
	// the key used by SignSchedule — eliminating the HEDERA_PLATFORM_PUBLIC_KEY
	// misconfiguration that caused NO_NEW_VALID_SIGNATURES.
	platformPubKey := client.GetOperatorPublicKey()

	return &HederaService{
		client:         client,
		network:        cfg.Network,
		usdcTokenID:    usdcTokenID,
		platformPubKey: platformPubKey,
		cfg:            cfg,
	}, nil
}

// SetNFTCollection sets the existing NFT collection token ID (loaded from config).
func (s *HederaService) SetNFTCollection(tokenIDStr string) error {
	if tokenIDStr == "" {
		return nil // optional
	}
	id, err := sdk.TokenIDFromString(tokenIDStr)
	if err != nil {
		return fmt.Errorf("invalid NFT collection token ID: %w", err)
	}
	s.nftCollectionID = id
	return nil
}

// --- Proof of Funds ---

// CheckProofOfFunds verifies that accountID holds at least requiredUSDC.
func (s *HederaService) CheckProofOfFunds(accountID string, requiredUSDC float64) (bool, float64, error) {
	result, err := meridianhedera.CheckProofOfFunds(s.network, accountID, s.cfg.USDCTokenID, requiredUSDC)
	if err != nil {
		return false, 0, err
	}
	return result.Verified, result.ActualUSDC, nil
}

// --- Escrow ---

// EscrowResult holds the on-chain identifiers created for a new deal escrow.
type EscrowResult struct {
	HederaAccountID string
	HCSTopicID      string
}

// CreateEscrow creates the escrow account and HCS deal topic for a new deal.
// The escrow account uses a 2-of-3 threshold key (buyer + seller + platform),
// so any two parties can authorise a debit on-chain.
//
// buyerPublicKeyHex and sellerPublicKeyHex are the hex-encoded Ed25519 public
// keys stored in the users table when each party links their Hedera wallet.
func (s *HederaService) CreateEscrow(dealID, buyerPublicKeyHex, sellerPublicKeyHex string) (*EscrowResult, error) {
	buyerKey, err := sdk.PublicKeyFromString(buyerPublicKeyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid buyer public key: %w", err)
	}

	sellerKey, err := sdk.PublicKeyFromString(sellerPublicKeyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid seller public key: %w", err)
	}

	escrowAccountID, err := meridianhedera.CreateEscrowAccount(s.client, buyerKey, sellerKey, s.platformPubKey)
	if err != nil {
		return nil, fmt.Errorf("create escrow account: %w", err)
	}

	// Create a dedicated HCS topic for the deal audit trail.
	topicID, err := meridianhedera.CreateDealTopic(s.client, dealID)
	if err != nil {
		return nil, fmt.Errorf("create deal topic: %w", err)
	}

	// Log the first milestone.
	_ = meridianhedera.LogEscrowCreated(s.client, topicID, dealID, escrowAccountID.String())

	return &EscrowResult{
		HederaAccountID: escrowAccountID.String(),
		HCSTopicID:      topicID.String(),
	}, nil
}

// ScheduleRelease creates a Scheduled Transaction to release escrow funds to the seller,
// then immediately adds the platform's explicit co-signature (1-of-3).
//
// The ScheduleCreateTransaction's outer signature is over the outer tx body, not the
// inner scheduled transfer — Hedera does NOT automatically credit it as an inner-tx
// signature. We must submit a separate ScheduleSignTransaction so the platform counts
// as 1-of-3 before the buyer signs.
func (s *HederaService) ScheduleRelease(escrowAccountIDStr, sellerAccountIDStr string, amountUSDC float64, dealID string) (string, error) {
	escrowAccountID, err := sdk.AccountIDFromString(escrowAccountIDStr)
	if err != nil {
		return "", fmt.Errorf("invalid escrow account: %w", err)
	}

	sellerAccountID, err := sdk.AccountIDFromString(sellerAccountIDStr)
	if err != nil {
		return "", fmt.Errorf("invalid seller account: %w", err)
	}

	memo := fmt.Sprintf("Meridian escrow release — deal %s", dealID)
	scheduleID, err := meridianhedera.ScheduleRelease(s.client, s.usdcTokenID, escrowAccountID, sellerAccountID, amountUSDC, memo)
	if err != nil {
		return "", fmt.Errorf("schedule release: %w", err)
	}

	// Add platform's explicit signature to the inner scheduled transaction (1-of-3).
	// Ignore NO_NEW_VALID_SIGNATURES — the network may already have auto-credited it.
	_ = meridianhedera.SignSchedule(s.client, scheduleID)

	return scheduleID.String(), nil
}

// SignSchedule explicitly adds the platform operator's signature to a scheduled transaction.
func (s *HederaService) SignSchedule(scheduleIDStr string) error {
	scheduleID, err := sdk.ScheduleIDFromString(scheduleIDStr)
	if err != nil {
		return fmt.Errorf("invalid schedule ID: %w", err)
	}
	return meridianhedera.SignSchedule(s.client, scheduleID)
}

// ScheduleRefund creates a Scheduled Transaction to return escrow funds to the buyer.
func (s *HederaService) ScheduleRefund(escrowAccountIDStr, buyerAccountIDStr string, amountUSDC float64, dealID string) (string, error) {
	escrowAccountID, err := sdk.AccountIDFromString(escrowAccountIDStr)
	if err != nil {
		return "", fmt.Errorf("invalid escrow account: %w", err)
	}

	buyerAccountID, err := sdk.AccountIDFromString(buyerAccountIDStr)
	if err != nil {
		return "", fmt.Errorf("invalid buyer account: %w", err)
	}

	memo := fmt.Sprintf("Meridian escrow refund — deal %s", dealID)
	scheduleID, err := meridianhedera.ScheduleRefund(s.client, s.usdcTokenID, escrowAccountID, buyerAccountID, amountUSDC, memo)
	if err != nil {
		return "", fmt.Errorf("schedule refund: %w", err)
	}

	return scheduleID.String(), nil
}

// IsUSDCAssociated returns true if the given Hedera account has associated with
// the platform's USDC token. An unassociated account cannot receive USDC transfers.
func (s *HederaService) IsUSDCAssociated(accountID string) (bool, error) {
	return meridianhedera.IsTokenAssociated(s.network, accountID, s.cfg.USDCTokenID)
}

// GetScheduleStatus fetches the current state of a scheduled transaction from the mirror node.
func (s *HederaService) GetScheduleStatus(scheduleIDStr string) (*meridianhedera.ScheduleInfo, error) {
	return meridianhedera.GetSchedule(s.network, scheduleIDStr)
}

// GetScheduledTransactionResult fetches the result code of the inner transaction
// that executed when the schedule threshold was met.
func (s *HederaService) GetScheduledTransactionResult(executedTimestamp string) (string, error) {
	return meridianhedera.GetScheduledTransactionResult(s.network, executedTimestamp)
}

// GetRecentAccountTransactions returns the most recent CRYPTOTRANSFER results for an account.
func (s *HederaService) GetRecentAccountTransactions(accountID string, limit int) ([]struct{ Result, Name string }, error) {
	return meridianhedera.GetRecentAccountTransactions(s.network, accountID, limit)
}

// --- HCS ---

// LogEvent writes a deal event to the escrow's HCS topic.
func (s *HederaService) LogEvent(topicIDStr, eventType, dealID string, payload map[string]string) error {
	topicID, err := sdk.TopicIDFromString(topicIDStr)
	if err != nil {
		return fmt.Errorf("invalid topic ID: %w", err)
	}

	return meridianhedera.LogEvent(s.client, topicID, meridianhedera.DealEvent{
		Type:    eventType,
		DealID:  dealID,
		Payload: payload,
	})
}

// GetDealEvents returns all HCS events for a deal's topic.
func (s *HederaService) GetDealEvents(topicIDStr string) ([]meridianhedera.DealEvent, error) {
	return meridianhedera.GetDealEvents(s.network, topicIDStr)
}

// --- NFT ---

// MintListingNFT mints an NFT representing a listing and returns the serial number.
func (s *HederaService) MintListingNFT(listingID uuid.UUID) (int64, error) {
	if s.nftCollectionID == (sdk.TokenID{}) {
		return 0, fmt.Errorf("NFT collection not configured (set HEDERA_NFT_COLLECTION_ID)")
	}

	metadata := fmt.Appendf(nil, `{"listing_id":"%s","platform":"Meridian"}`, listingID)
	return meridianhedera.MintListingNFT(s.client, s.nftCollectionID, metadata)
}

// TransferNFTFromPlatform transfers a listing NFT from the platform treasury (operator account)
// to the buyer. This is the normal post-close path — the NFT always lives in the platform
// treasury after minting, so the from account is always the operator.
func (s *HederaService) TransferNFTFromPlatform(serialNumber int64, toAccountIDStr string) error {
	return s.TransferListingNFT(serialNumber, s.cfg.OperatorAccountID, toAccountIDStr)
}

// TransferListingNFT transfers a listing NFT from the platform treasury to the buyer.
func (s *HederaService) TransferListingNFT(serialNumber int64, fromAccountIDStr, toAccountIDStr string) error {
	if s.nftCollectionID == (sdk.TokenID{}) {
		return fmt.Errorf("NFT collection not configured")
	}

	from, err := sdk.AccountIDFromString(fromAccountIDStr)
	if err != nil {
		return fmt.Errorf("invalid from account: %w", err)
	}

	to, err := sdk.AccountIDFromString(toAccountIDStr)
	if err != nil {
		return fmt.Errorf("invalid to account: %w", err)
	}

	return meridianhedera.TransferListingNFT(s.client, s.nftCollectionID, serialNumber, from, to)
}

// --- Mirror node ---

// GetAccountPublicKey returns the Ed25519 public key for a Hedera account.
func (s *HederaService) GetAccountPublicKey(accountID string) (string, error) {
	info, err := meridianhedera.GetAccountInfo(s.network, accountID)
	if err != nil {
		return "", err
	}
	return info.Key.Key, nil
}
