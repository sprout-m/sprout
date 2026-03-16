package model

import (
	"time"

	"github.com/google/uuid"
)

type Milestone struct {
	ID          uuid.UUID `json:"id"`
	ProjectID   uuid.UUID `json:"project_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Amount      float64   `json:"amount"`
	OrderIndex  int       `json:"order_index"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}
