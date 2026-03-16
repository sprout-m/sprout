package model

import (
	"time"

	"github.com/google/uuid"
)

type Investment struct {
	ID          uuid.UUID `json:"id"`
	ProjectID   uuid.UUID `json:"project_id"`
	FunderID    uuid.UUID `json:"funder_id"`
	Amount      float64   `json:"amount"`
	HederaTxID  string    `json:"hedera_tx_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type InvestmentWithProject struct {
	Investment
	ProjectName     string `json:"project_name"`
	ProjectStatus   string `json:"project_status"`
	ProjectCategory string `json:"project_category"`
	ProjectGoal     string `json:"project_goal"`
}
