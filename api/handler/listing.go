package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
)

// listListings returns teaser data for all live listings.
// Full financials and dataroom folders are never included here.
func (h *Handler) ListListings(c *gin.Context) {
	rows, err := h.db.Query(context.Background(), `
		SELECT id, seller_id, anonymized_name, category, industry_tags,
		       location, asking_range, revenue_range, profit_range, age,
		       teaser_description, status, verified, nda_required, escrow_type,
		       created_at, updated_at
		FROM listings
		WHERE status = 'live'
		ORDER BY created_at DESC
	`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	listings := make([]model.Listing, 0)
	for rows.Next() {
		var l model.Listing
		if err := rows.Scan(
			&l.ID, &l.SellerID, &l.AnonymizedName, &l.Category, &l.IndustryTags,
			&l.Location, &l.AskingRange, &l.RevenueRange, &l.ProfitRange, &l.Age,
			&l.TeaserDescription, &l.Status, &l.Verified, &l.NDARequired, &l.EscrowType,
			&l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			continue
		}
		listings = append(listings, l)
	}

	ok(c, listings)
}

// MyListings returns all listings owned by the authenticated seller, in any status.
func (h *Handler) MyListings(c *gin.Context) {
	claims := middleware.GetClaims(c)

	rows, err := h.db.Query(context.Background(), `
		SELECT id, seller_id, anonymized_name, category, industry_tags,
		       location, asking_range, revenue_range, profit_range, age,
		       teaser_description, status, verified, nda_required, escrow_type,
		       full_financials, dataroom_folders, created_at, updated_at
		FROM listings
		WHERE seller_id = $1
		ORDER BY created_at DESC
	`, claims.UserID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	listings := make([]model.Listing, 0)
	for rows.Next() {
		var l model.Listing
		var fullFinancials, dataroomFolders []byte
		if err := rows.Scan(
			&l.ID, &l.SellerID, &l.AnonymizedName, &l.Category, &l.IndustryTags,
			&l.Location, &l.AskingRange, &l.RevenueRange, &l.ProfitRange, &l.Age,
			&l.TeaserDescription, &l.Status, &l.Verified, &l.NDARequired, &l.EscrowType,
			&fullFinancials, &dataroomFolders, &l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			continue
		}
		l.FullFinancials = json.RawMessage(fullFinancials)
		l.DataroomFolders = json.RawMessage(dataroomFolders)
		listings = append(listings, l)
	}

	ok(c, listings)
}

// GetListing returns full listing detail. Private fields are gated by access level.
func (h *Handler) GetListing(c *gin.Context) {
	id, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var l model.Listing
	var fullFinancials, dataroomFolders []byte
	err := h.db.QueryRow(context.Background(), `
		SELECT id, seller_id, anonymized_name, category, industry_tags,
		       location, asking_range, revenue_range, profit_range, age,
		       teaser_description, status, verified, nda_required, escrow_type,
		       COALESCE(nft_token_id,''), COALESCE(hcs_topic_id,''),
		       full_financials, dataroom_folders, created_at, updated_at
		FROM listings WHERE id = $1
	`, id).Scan(
		&l.ID, &l.SellerID, &l.AnonymizedName, &l.Category, &l.IndustryTags,
		&l.Location, &l.AskingRange, &l.RevenueRange, &l.ProfitRange, &l.Age,
		&l.TeaserDescription, &l.Status, &l.Verified, &l.NDARequired, &l.EscrowType,
		&l.NFTTokenID, &l.HCSTopicID,
		&fullFinancials, &dataroomFolders, &l.CreatedAt, &l.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		fail(c, http.StatusNotFound, "listing not found")
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}

	l.FullFinancials = json.RawMessage(fullFinancials)
	l.DataroomFolders = json.RawMessage(dataroomFolders)

	claims := middleware.GetClaims(c)
	if claims == nil {
		ok(c, l.Teaser())
		return
	}

	// Seller always sees their own listing in full.
	if claims.UserID == l.SellerID || claims.Role == "operator" {
		ok(c, l)
		return
	}

	// Buyers need an approved access request to see private data.
	var decision string
	_ = h.db.QueryRow(context.Background(), `
		SELECT seller_decision FROM access_requests
		WHERE listing_id = $1 AND buyer_id = $2
	`, id, claims.UserID).Scan(&decision)

	if decision == "approved" {
		ok(c, l)
	} else {
		ok(c, l.Teaser())
	}
}

type createListingRequest struct {
	AnonymizedName    string          `json:"anonymized_name"   binding:"required"`
	Category          string          `json:"category"          binding:"required"`
	IndustryTags      []string        `json:"industry_tags"`
	Location          string          `json:"location"`
	AskingRange       string          `json:"asking_range"`
	RevenueRange      string          `json:"revenue_range"`
	ProfitRange       string          `json:"profit_range"`
	Age               string          `json:"age"`
	TeaserDescription string          `json:"teaser_description"`
	NDARequired       bool            `json:"nda_required"`
	FullFinancials    json.RawMessage `json:"full_financials"`
	DataroomFolders   json.RawMessage `json:"dataroom_folders"`
}

func (h *Handler) CreateListing(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims.Role != "seller" && claims.Role != "operator" {
		fail(c, http.StatusForbidden, "only sellers can create listings")
		return
	}

	var req createListingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	tags := req.IndustryTags
	if tags == nil {
		tags = []string{}
	}

	var l model.Listing
	var fullFinancials, dataroomFolders []byte
	err := h.db.QueryRow(context.Background(), `
		INSERT INTO listings (
			seller_id, anonymized_name, category, industry_tags, location,
			asking_range, revenue_range, profit_range, age, teaser_description,
			nda_required, full_financials, dataroom_folders
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		RETURNING id, seller_id, anonymized_name, category, industry_tags,
		          location, asking_range, revenue_range, profit_range, age,
		          teaser_description, status, verified, nda_required, escrow_type,
		          full_financials, dataroom_folders, created_at, updated_at
	`,
		claims.UserID, req.AnonymizedName, req.Category, tags, req.Location,
		req.AskingRange, req.RevenueRange, req.ProfitRange, req.Age, req.TeaserDescription,
		req.NDARequired, nullJSON(req.FullFinancials), nullJSON(req.DataroomFolders),
	).Scan(
		&l.ID, &l.SellerID, &l.AnonymizedName, &l.Category, &l.IndustryTags,
		&l.Location, &l.AskingRange, &l.RevenueRange, &l.ProfitRange, &l.Age,
		&l.TeaserDescription, &l.Status, &l.Verified, &l.NDARequired, &l.EscrowType,
		&fullFinancials, &dataroomFolders, &l.CreatedAt, &l.UpdatedAt,
	)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to create listing")
		return
	}

	l.FullFinancials = json.RawMessage(fullFinancials)
	l.DataroomFolders = json.RawMessage(dataroomFolders)

	// Optionally mint a listing NFT in the background.
	// The metadata URL points to our own /nft/metadata/:id endpoint (HIP-412),
	// which in turn serves the generated image via /nft/image/:id.
	if h.hedera != nil {
		go func(listingID uuid.UUID) {
			metadataURL := fmt.Sprintf("%s/api/v1/nft/metadata/%s", h.cfg.AppBaseURL, listingID)
			serial, err := h.hedera.MintListingNFT(metadataURL)
			if err != nil {
				return
			}
			h.db.Exec(context.Background(), `
				UPDATE listings SET nft_serial_number = $1 WHERE id = $2
			`, serial, listingID)
		}(l.ID)
	}

	created(c, l)
}

type updateListingRequest struct {
	Status            *string         `json:"status"`
	TeaserDescription *string         `json:"teaser_description"`
	AskingRange       *string         `json:"asking_range"`
	FullFinancials    json.RawMessage `json:"full_financials"`
	DataroomFolders   json.RawMessage `json:"dataroom_folders"`
}

func (h *Handler) UpdateListing(c *gin.Context) {
	claims := middleware.GetClaims(c)
	id, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	// Verify ownership.
	var sellerID uuid.UUID
	if err := h.db.QueryRow(context.Background(),
		`SELECT seller_id FROM listings WHERE id = $1`, id).Scan(&sellerID); err != nil {
		fail(c, http.StatusNotFound, "listing not found")
		return
	}
	if sellerID != claims.UserID && claims.Role != "operator" {
		fail(c, http.StatusForbidden, "not your listing")
		return
	}

	var req updateListingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	_, err := h.db.Exec(context.Background(), `
		UPDATE listings SET
			status             = COALESCE($1, status),
			teaser_description = COALESCE($2, teaser_description),
			asking_range       = COALESCE($3, asking_range),
			full_financials    = COALESCE($4, full_financials),
			dataroom_folders   = COALESCE($5, dataroom_folders),
			updated_at         = NOW()
		WHERE id = $6
	`, req.Status, req.TeaserDescription, req.AskingRange,
		nullJSON(req.FullFinancials), nullJSON(req.DataroomFolders), id)
	if err != nil {
		fail(c, http.StatusInternalServerError, "update failed")
		return
	}

	// Re-fetch and return the full updated listing.
	h.GetListing(c)
}

// nullJSON returns nil if the RawMessage is empty, otherwise returns it as-is.
// This prevents storing "null" or empty bytes in JSONB columns.
func nullJSON(r json.RawMessage) any {
	if len(r) == 0 || string(r) == "null" {
		return nil
	}
	return r
}
