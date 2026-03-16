package service

import (
	"fmt"

	sdk "github.com/hashgraph/hedera-sdk-go/v2"
	sprouthedera "github.com/meridian-mkt/hedera"
)

// HederaService wraps the hedera package for Sprout's project/milestone workflow.
type HederaService struct {
	client  *sdk.Client
	network string
	enabled bool
}

// NewHederaService builds a HederaService from the given config.
// If credentials are absent it returns a stub that no-ops all on-chain calls.
func NewHederaService(cfg *sprouthedera.Config) (*HederaService, error) {
	if cfg.OperatorAccountID == "" || cfg.OperatorPrivateKey == "" {
		return &HederaService{network: cfg.Network, enabled: false}, nil
	}
	client, err := sprouthedera.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("hedera client: %w", err)
	}

	return &HederaService{
		client:  client,
		network: cfg.Network,
		enabled: true,
	}, nil
}

// --- Project setup ---

// ProjectResult holds the on-chain identifiers created for a new project.
type ProjectResult struct {
	HederaEscrowAccount string
	HCSTopicID          string
}

// CreateProject creates a Hedera escrow account and HCS topic for a new project.
func (s *HederaService) CreateProject(projectID string) (*ProjectResult, error) {
	if !s.enabled {
		return &ProjectResult{}, nil
	}
	accountID, err := sprouthedera.CreateProjectAccount(s.client)
	if err != nil {
		return nil, fmt.Errorf("create project account: %w", err)
	}

	topicID, err := sprouthedera.CreateDealTopic(s.client, projectID)
	if err != nil {
		return nil, fmt.Errorf("create project HCS topic: %w", err)
	}

	_ = sprouthedera.LogEvent(s.client, topicID, sprouthedera.DealEvent{
		Type:      sprouthedera.EventProjectCreated,
		ProjectID: projectID,
		Payload: map[string]string{
			"escrow_account": accountID.String(),
		},
	})

	return &ProjectResult{
		HederaEscrowAccount: accountID.String(),
		HCSTopicID:          topicID.String(),
	}, nil
}

// --- Fund release ---

// ReleaseToOrganizer transfers HBAR from escrow to organizer after KMS approval.
func (s *HederaService) ReleaseToOrganizer(escrowAccountID, organizerAccountID string, amountTinybar int64) (string, error) {
	if !s.enabled {
		return "", nil
	}
	return sprouthedera.ReleaseToOrganizer(s.client, escrowAccountID, organizerAccountID, amountTinybar)
}

// --- HCS events ---

// LogEvent writes a project event to the HCS topic.
func (s *HederaService) LogEvent(topicIDStr, eventType, projectID string, payload map[string]string) error {
	if !s.enabled || topicIDStr == "" {
		return nil
	}
	topicID, err := sdk.TopicIDFromString(topicIDStr)
	if err != nil {
		return fmt.Errorf("invalid topic ID: %w", err)
	}

	return sprouthedera.LogEvent(s.client, topicID, sprouthedera.DealEvent{
		Type:      eventType,
		ProjectID: projectID,
		Payload:   payload,
	})
}

// GetProjectEvents returns all HCS events for a project's topic.
func (s *HederaService) GetProjectEvents(topicIDStr string) ([]sprouthedera.DealEvent, error) {
	if !s.enabled || topicIDStr == "" {
		return nil, nil
	}
	return sprouthedera.GetDealEvents(s.network, topicIDStr)
}

// --- Mirror node ---

// GetAccountPublicKey returns the Ed25519 public key for a Hedera account.
func (s *HederaService) GetAccountPublicKey(accountID string) (string, error) {
	info, err := sprouthedera.GetAccountInfo(s.network, accountID)
	if err != nil {
		return "", err
	}
	return info.Key.Key, nil
}
