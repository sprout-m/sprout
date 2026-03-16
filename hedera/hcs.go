package hedera

import (
	"encoding/json"
	"fmt"
	"time"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

// Sprout event type constants written to HCS for each project milestone.
const (
	EventProjectCreated    = "PROJECT_CREATED"
	EventProofSubmitted    = "PROOF_SUBMITTED"
	EventMilestoneApproved = "MILESTONE_APPROVED"
	EventMilestoneRejected = "MILESTONE_REJECTED"
	EventFundsReleased     = "FUNDS_RELEASED"
)

type DealEvent struct {
	Type      string            `json:"type"`
	ProjectID string            `json:"project_id"`
	Payload   map[string]string `json:"payload,omitempty"`
	Timestamp string            `json:"timestamp"`
}

func CreateDealTopic(client *hedera.Client, projectID string) (hedera.TopicID, error) {
	operatorKey := client.GetOperatorPublicKey()

	txResponse, err := hedera.NewTopicCreateTransaction().
		SetTopicMemo(fmt.Sprintf("sprout project: %s", projectID)).
		SetSubmitKey(operatorKey).
		Execute(client)
	if err != nil {
		return hedera.TopicID{}, fmt.Errorf("create HCS topic for project %s: %w", projectID, err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return hedera.TopicID{}, fmt.Errorf("get topic receipt for project %s: %w", projectID, err)
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
