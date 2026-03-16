package model

import (
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID                  uuid.UUID `json:"id"`
	OrganizerID         uuid.UUID `json:"organizer_id"`
	Name                string    `json:"name"`
	Description         string    `json:"description"`
	Category            string    `json:"category"`
	Goal                string    `json:"goal"`
	TotalAmount         float64   `json:"total_amount"`
	AmountFunded        float64   `json:"amount_funded"`
	AmountReleased      float64   `json:"amount_released"`
	Status              string    `json:"status"`
	HCSTopicID          string    `json:"hcs_topic_id,omitempty"`
	HederaEscrowAccount string    `json:"hedera_escrow_account,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
}
