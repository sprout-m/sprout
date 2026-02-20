package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type OfferTerms struct {
	DealType        string `json:"deal_type"`
	CloseWindow     string `json:"close_window"`
	DiligencePeriod string `json:"diligence_period"`
}

type Offer struct {
	ID         uuid.UUID       `json:"id"`
	ListingID  uuid.UUID       `json:"listing_id"`
	BuyerID    uuid.UUID       `json:"buyer_id"`
	AmountUSDC float64         `json:"amount_usdc"`
	Terms      json.RawMessage `json:"terms,omitempty"`
	Notes      string          `json:"notes,omitempty"`
	Status     string          `json:"status"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}
