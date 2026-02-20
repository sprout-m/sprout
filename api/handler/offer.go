package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/meridian-marketplace/api/middleware"
	"github.com/meridian-marketplace/api/model"
)

type submitOfferBody struct {
	AmountUSDC float64         `json:"amount_usdc" binding:"required,gt=0"`
	Terms      json.RawMessage `json:"terms"`
	Notes      string          `json:"notes"`
}

// SubmitOffer — buyer submits an offer on a listing.
func (h *Handler) SubmitOffer(c *gin.Context) {
	claims := middleware.GetClaims(c)
	listingID, valid := parseUUID(c, "id")
	if !valid {
		return
	}

	// Buyer must have approved access to submit an offer.
	var decision string
	_ = h.db.QueryRow(context.Background(), `
		SELECT seller_decision FROM access_requests
		WHERE listing_id = $1 AND buyer_id = $2
	`, listingID, claims.UserID).Scan(&decision)
	if decision != "approved" {
		fail(c, http.StatusForbidden, "access request must be approved before submitting an offer")
		return
	}

	var req submitOfferBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	var o model.Offer
	var termsBytes []byte
	err := h.db.QueryRow(context.Background(), `
		INSERT INTO offers (listing_id, buyer_id, amount_usdc, terms, notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, listing_id, buyer_id, amount_usdc, terms, COALESCE(notes,''), status, created_at, updated_at
	`, listingID, claims.UserID, req.AmountUSDC, nullJSON(req.Terms), req.Notes).
		Scan(&o.ID, &o.ListingID, &o.BuyerID, &o.AmountUSDC, &termsBytes, &o.Notes, &o.Status, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to submit offer")
		return
	}
	o.Terms = json.RawMessage(termsBytes)

	created(c, o)
}

// ListOffersForListing — seller sees all offers on their listing.
func (h *Handler) ListOffersForListing(c *gin.Context) {
	claims := middleware.GetClaims(c)
	listingID, valid := parseUUID(c, "id")
	if !valid {
		return
	}

	var sellerID string
	if err := h.db.QueryRow(context.Background(),
		`SELECT seller_id FROM listings WHERE id = $1`, listingID).Scan(&sellerID); err != nil {
		fail(c, http.StatusNotFound, "listing not found")
		return
	}
	if sellerID != claims.UserID.String() && claims.Role != "operator" {
		fail(c, http.StatusForbidden, "not your listing")
		return
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT id, listing_id, buyer_id, amount_usdc, terms, COALESCE(notes,''), status, created_at, updated_at
		FROM offers WHERE listing_id = $1
		ORDER BY created_at DESC
	`, listingID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	result := scanOffers(rows)
	ok(c, result)
}

// MyOffers — buyer sees all their submitted offers.
func (h *Handler) MyOffers(c *gin.Context) {
	claims := middleware.GetClaims(c)

	rows, err := h.db.Query(context.Background(), `
		SELECT id, listing_id, buyer_id, amount_usdc, terms, COALESCE(notes,''), status, created_at, updated_at
		FROM offers WHERE buyer_id = $1
		ORDER BY created_at DESC
	`, claims.UserID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	ok(c, scanOffers(rows))
}

type updateOfferStatusBody struct {
	Status string `json:"status" binding:"required,oneof=shortlisted accepted rejected"`
}

// UpdateOfferStatus — seller shortlists, accepts, or rejects an offer.
// Accepting an offer automatically creates the on-chain escrow account.
func (h *Handler) UpdateOfferStatus(c *gin.Context) {
	claims := middleware.GetClaims(c)
	offerID, valid := parseUUID(c, "id")
	if !valid {
		return
	}

	var req updateOfferStatusBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify seller owns the listing.
	var sellerID string
	var amountUSDC float64
	if err := h.db.QueryRow(context.Background(), `
		SELECT l.seller_id, o.amount_usdc
		FROM offers o JOIN listings l ON l.id = o.listing_id
		WHERE o.id = $1
	`, offerID).Scan(&sellerID, &amountUSDC); err != nil {
		fail(c, http.StatusNotFound, "offer not found")
		return
	}
	if sellerID != claims.UserID.String() && claims.Role != "operator" {
		fail(c, http.StatusForbidden, "not your listing")
		return
	}

	var o model.Offer
	var termsBytes []byte
	err := h.db.QueryRow(context.Background(), `
		UPDATE offers SET status = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, listing_id, buyer_id, amount_usdc, terms, COALESCE(notes,''), status, created_at, updated_at
	`, req.Status, offerID).
		Scan(&o.ID, &o.ListingID, &o.BuyerID, &o.AmountUSDC, &termsBytes, &o.Notes, &o.Status, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "update failed")
		return
	}
	o.Terms = json.RawMessage(termsBytes)

	// On acceptance, spin up the Hedera escrow account.
	if req.Status == "accepted" {
		go h.initEscrow(o.ID, o.ListingID, o.BuyerID, amountUSDC)

		// Mark the listing as under offer.
		h.db.Exec(context.Background(),
			`UPDATE listings SET status='under_offer', updated_at=NOW() WHERE id=$1`, o.ListingID)
	}

	ok(c, o)
}

// scanOffers reads all rows from a Query result into a slice of Offer.
func scanOffers(rows interface{ Next() bool; Scan(...any) error; Close() }) []model.Offer {
	result := make([]model.Offer, 0)
	for rows.Next() {
		var o model.Offer
		var termsBytes []byte
		if err := rows.Scan(&o.ID, &o.ListingID, &o.BuyerID, &o.AmountUSDC,
			&termsBytes, &o.Notes, &o.Status, &o.CreatedAt, &o.UpdatedAt); err != nil {
			continue
		}
		o.Terms = json.RawMessage(termsBytes)
		result = append(result, o)
	}
	return result
}
