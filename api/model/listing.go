package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Listing struct {
	ID               uuid.UUID       `json:"id"`
	SellerID         uuid.UUID       `json:"seller_id"`
	AnonymizedName   string          `json:"anonymized_name"`
	Category         string          `json:"category"`
	IndustryTags     []string        `json:"industry_tags"`
	Location         string          `json:"location,omitempty"`
	AskingRange      string          `json:"asking_range,omitempty"`
	RevenueRange     string          `json:"revenue_range,omitempty"`
	ProfitRange      string          `json:"profit_range,omitempty"`
	Age              string          `json:"age,omitempty"`
	TeaserDescription string         `json:"teaser_description,omitempty"`
	Status           string          `json:"status"`
	Verified         bool            `json:"verified"`
	NDARequired      bool            `json:"nda_required"`
	EscrowType       string          `json:"escrow_type"`
	NFTTokenID       string          `json:"nft_token_id,omitempty"`
	NFTSerialNumber  int64           `json:"nft_serial_number,omitempty"`
	HCSTopicID       string          `json:"hcs_topic_id,omitempty"`
	FullFinancials   json.RawMessage `json:"full_financials,omitempty"`
	DataroomFolders  json.RawMessage `json:"dataroom_folders,omitempty"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
}

// Teaser returns a copy of the listing with the private fields zeroed out.
// Used when a buyer has not been granted data room access.
func (l Listing) Teaser() Listing {
	l.FullFinancials = nil
	l.DataroomFolders = nil
	l.NFTTokenID = ""
	l.HCSTopicID = ""
	return l
}
