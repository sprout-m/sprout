package model

import (
	"time"

	"github.com/google/uuid"
)

type AccessRequest struct {
	ID                   uuid.UUID  `json:"id"`
	ListingID            uuid.UUID  `json:"listing_id"`
	BuyerID              uuid.UUID  `json:"buyer_id"`
	NDASignied           bool       `json:"nda_signed"`
	ProofOfFundsStatus   string     `json:"proof_of_funds_status"`
	ProofAmountUSDC      float64    `json:"proof_amount_usdc,omitempty"`
	ProofMethod          string     `json:"proof_method,omitempty"`
	ProofTxID            string     `json:"proof_tx_id,omitempty"`
	SellerDecision       string     `json:"seller_decision"`
	AccessLevel          string     `json:"access_level,omitempty"`
	RequestedAt          time.Time  `json:"requested_at"`
	DecidedAt            *time.Time `json:"decided_at,omitempty"`
}
