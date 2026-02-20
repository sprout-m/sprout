package model

import (
	"time"

	"github.com/google/uuid"
)

type Escrow struct {
	ID               uuid.UUID  `json:"id"`
	OfferID          uuid.UUID  `json:"offer_id"`
	HederaAccountID  string     `json:"hedera_account_id,omitempty"`
	HCSTopicID       string     `json:"hcs_topic_id,omitempty"`
	ScheduleID       string     `json:"schedule_id,omitempty"`
	BuyerDepositTx   string     `json:"buyer_deposit_tx,omitempty"`
	SellerTransferTx string     `json:"seller_transfer_tx,omitempty"`
	AmountUSDC       float64    `json:"amount_usdc"`
	Status           string     `json:"status"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}
