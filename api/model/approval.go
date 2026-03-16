package model

import (
	"time"

	"github.com/google/uuid"
)

type Approval struct {
	ID              uuid.UUID `json:"id"`
	MilestoneID     uuid.UUID `json:"milestone_id"`
	VerifierID      uuid.UUID `json:"verifier_id"`
	Decision        string    `json:"decision"`
	Note            string    `json:"note"`
	ApprovalPayload string    `json:"approval_payload,omitempty"`
	KMSKeyID        string    `json:"kms_key_id,omitempty"`
	KMSSignature    string    `json:"kms_signature,omitempty"`
	HederaTxID      string    `json:"hedera_tx_id,omitempty"`
	DecidedAt       time.Time `json:"decided_at"`
}
