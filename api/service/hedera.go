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

	platformPubKey, err := sdk.PublicKeyFromString(cfg.PlatformPublicKey)
	if err != nil {
		return nil, fmt.Errorf("invalid platform public key: %w", err)
	}

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
// buyerPublicKey and sellerPublicKey should be DER-encoded hex strings fetched
// from the Hedera mirror node (or provided by the users at wallet link time).
func (s *HederaService) CreateEscrow(dealID string, buyerPublicKeyHex, sellerPublicKeyHex string) (*EscrowResult, error) {
	buyerKey, err := sdk.PublicKeyFromString(buyerPublicKeyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid buyer public key: %w", err)
	}

	sellerKey, err := sdk.PublicKeyFromString(sellerPublicKeyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid seller public key: %w", err)
	}

	// Create the 2-of-3 threshold escrow account.
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

// ScheduleRelease creates a Scheduled Transaction to release escrow funds to the seller.
// Returns the Hedera ScheduleID string that the buyer must co-sign via their wallet.
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

	return scheduleID.String(), nil
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

// GetScheduleStatus fetches the current state of a scheduled transaction from the mirror node.
func (s *HederaService) GetScheduleStatus(scheduleIDStr string) (*meridianhedera.ScheduleInfo, error) {
	return meridianhedera.GetSchedule(s.network, scheduleIDStr)
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
