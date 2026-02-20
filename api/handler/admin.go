package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/meridian-mkt/api/middleware"
)

func operatorOnly(c *gin.Context) bool {
	claims := middleware.GetClaims(c)
	if claims == nil || claims.Role != "operator" {
		fail(c, http.StatusForbidden, "operator only")
		return false
	}
	return true
}

// ── Stats ────────────────────────────────────────────────────────────────────

type platformStats struct {
	TotalUsers      int `json:"total_users"`
	TotalBuyers     int `json:"total_buyers"`
	TotalSellers    int `json:"total_sellers"`
	TotalOperators  int `json:"total_operators"`
	ListingsLive    int `json:"listings_live"`
	ListingsDraft   int `json:"listings_draft"`
	OffersTotal     int `json:"offers_total"`
	OffersPending   int `json:"offers_pending"`
	OffersAccepted  int `json:"offers_accepted"`
	EscrowsTotal    int `json:"escrows_total"`
	EscrowsFunded   int `json:"escrows_funded"`
	EscrowsDisputed int `json:"escrows_disputed"`
	EscrowsReleased int `json:"escrows_released"`
}

func (h *Handler) AdminStats(c *gin.Context) {
	if !operatorOnly(c) {
		return
	}

	var s platformStats

	h.db.QueryRow(context.Background(), `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE role = 'buyer'),
			COUNT(*) FILTER (WHERE role = 'seller'),
			COUNT(*) FILTER (WHERE role = 'operator')
		FROM users
	`).Scan(&s.TotalUsers, &s.TotalBuyers, &s.TotalSellers, &s.TotalOperators)

	h.db.QueryRow(context.Background(), `
		SELECT
			COUNT(*) FILTER (WHERE status = 'live'),
			COUNT(*) FILTER (WHERE status = 'draft')
		FROM listings
	`).Scan(&s.ListingsLive, &s.ListingsDraft)

	h.db.QueryRow(context.Background(), `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'pending'),
			COUNT(*) FILTER (WHERE status = 'accepted')
		FROM offers
	`).Scan(&s.OffersTotal, &s.OffersPending, &s.OffersAccepted)

	h.db.QueryRow(context.Background(), `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'funded'),
			COUNT(*) FILTER (WHERE status = 'disputed'),
			COUNT(*) FILTER (WHERE status IN ('released', 'releaseScheduled'))
		FROM escrows
	`).Scan(&s.EscrowsTotal, &s.EscrowsFunded, &s.EscrowsDisputed, &s.EscrowsReleased)

	ok(c, s)
}

// ── Users ────────────────────────────────────────────────────────────────────

type adminUserRow struct {
	ID              uuid.UUID `json:"id"`
	Email           string    `json:"email"`
	Handle          string    `json:"handle"`
	Role            string    `json:"role"`
	HederaAccountID string    `json:"hedera_account_id,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

func (h *Handler) AdminListUsers(c *gin.Context) {
	if !operatorOnly(c) {
		return
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT id, email, handle, role, COALESCE(hedera_account_id, ''), created_at
		FROM users
		ORDER BY created_at DESC
	`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	users := make([]adminUserRow, 0)
	for rows.Next() {
		var u adminUserRow
		if err := rows.Scan(&u.ID, &u.Email, &u.Handle, &u.Role, &u.HederaAccountID, &u.CreatedAt); err != nil {
			continue
		}
		users = append(users, u)
	}

	ok(c, users)
}

// ── Listings ─────────────────────────────────────────────────────────────────

type adminListingRow struct {
	ID             uuid.UUID `json:"id"`
	AnonymizedName string    `json:"anonymized_name"`
	Category       string    `json:"category"`
	Status         string    `json:"status"`
	Verified       bool      `json:"verified"`
	AskingRange    string    `json:"asking_range"`
	NDARequired    bool      `json:"nda_required"`
	SellerID       uuid.UUID `json:"seller_id"`
	SellerHandle   string    `json:"seller_handle"`
	CreatedAt      time.Time `json:"created_at"`
}

func (h *Handler) AdminAllListings(c *gin.Context) {
	if !operatorOnly(c) {
		return
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT l.id, l.anonymized_name, l.category, l.status, l.verified,
		       l.asking_range, l.nda_required, l.seller_id, u.handle, l.created_at
		FROM listings l
		JOIN users u ON u.id = l.seller_id
		ORDER BY l.created_at DESC
	`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	listings := make([]adminListingRow, 0)
	for rows.Next() {
		var l adminListingRow
		if err := rows.Scan(
			&l.ID, &l.AnonymizedName, &l.Category, &l.Status, &l.Verified,
			&l.AskingRange, &l.NDARequired, &l.SellerID, &l.SellerHandle, &l.CreatedAt,
		); err != nil {
			continue
		}
		listings = append(listings, l)
	}

	ok(c, listings)
}

type verifyListingBody struct {
	Verified bool `json:"verified"`
}

func (h *Handler) AdminVerifyListing(c *gin.Context) {
	if !operatorOnly(c) {
		return
	}
	id, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var req verifyListingBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	_, err := h.db.Exec(context.Background(),
		`UPDATE listings SET verified = $1, updated_at = NOW() WHERE id = $2`,
		req.Verified, id)
	if err != nil {
		fail(c, http.StatusInternalServerError, "update failed")
		return
	}

	ok(c, gin.H{"id": id, "verified": req.Verified})
}

// ── Disputes ─────────────────────────────────────────────────────────────────

type disputeRow struct {
	ID              uuid.UUID `json:"id"`
	Status          string    `json:"status"`
	AmountUSDC      float64   `json:"amount_usdc"`
	HederaAccountID string    `json:"hedera_account_id"`
	BuyerID         uuid.UUID `json:"buyer_id"`
	BuyerHandle     string    `json:"buyer_handle"`
	BuyerEmail      string    `json:"buyer_email"`
	SellerID        uuid.UUID `json:"seller_id"`
	SellerHandle    string    `json:"seller_handle"`
	SellerEmail     string    `json:"seller_email"`
	ListingID       uuid.UUID `json:"listing_id"`
	ListingName     string    `json:"listing_name"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (h *Handler) AdminListDisputes(c *gin.Context) {
	if !operatorOnly(c) {
		return
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT e.id, e.status, e.amount_usdc, COALESCE(e.hedera_account_id, ''),
		       buyer.id,   buyer.handle,   buyer.email,
		       seller.id,  seller.handle,  seller.email,
		       l.id,       l.anonymized_name,
		       e.created_at, e.updated_at
		FROM escrows e
		JOIN offers   o      ON o.id     = e.offer_id
		JOIN listings l      ON l.id     = o.listing_id
		JOIN users    buyer  ON buyer.id  = o.buyer_id
		JOIN users    seller ON seller.id = l.seller_id
		WHERE e.status = 'disputed'
		ORDER BY e.updated_at DESC
	`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	disputes := make([]disputeRow, 0)
	for rows.Next() {
		var d disputeRow
		if err := rows.Scan(
			&d.ID, &d.Status, &d.AmountUSDC, &d.HederaAccountID,
			&d.BuyerID, &d.BuyerHandle, &d.BuyerEmail,
			&d.SellerID, &d.SellerHandle, &d.SellerEmail,
			&d.ListingID, &d.ListingName,
			&d.CreatedAt, &d.UpdatedAt,
		); err != nil {
			continue
		}
		disputes = append(disputes, d)
	}

	ok(c, disputes)
}

type resolveDisputeBody struct {
	Resolution string `json:"resolution" binding:"required,oneof=release refund"`
	Note       string `json:"note"`
}

func (h *Handler) AdminResolveDispute(c *gin.Context) {
	if !operatorOnly(c) {
		return
	}

	id, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var req resolveDisputeBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	newStatus := "completed"
	if req.Resolution == "refund" {
		newStatus = "refunded"
	}

	tag, err := h.db.Exec(context.Background(), `
		UPDATE escrows SET status = $1, updated_at = NOW()
		WHERE id = $2 AND status = 'disputed'
	`, newStatus, id)
	if err != nil || tag.RowsAffected() == 0 {
		fail(c, http.StatusNotFound, "disputed escrow not found")
		return
	}

	ok(c, gin.H{"id": id, "status": newStatus, "resolution": req.Resolution})
}
