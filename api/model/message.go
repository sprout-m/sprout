package model

import (
	"time"

	"github.com/google/uuid"
)

type MessageThread struct {
	ID        uuid.UUID `json:"id"`
	ListingID uuid.UUID `json:"listing_id"`
	BuyerID   uuid.UUID `json:"buyer_id"`
	SellerID  uuid.UUID `json:"seller_id"`
	Title     string    `json:"title,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Message struct {
	ID         uuid.UUID  `json:"id"`
	ThreadID   uuid.UUID  `json:"thread_id"`
	SenderID   *uuid.UUID `json:"sender_id,omitempty"`
	SenderType string     `json:"sender_type"`
	Body       string     `json:"body"`
	CreatedAt  time.Time  `json:"created_at"`
}
