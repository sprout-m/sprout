package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
)

type requestAccessBody struct {
	NDASigned       bool    `json:"nda_signed"         binding:"required"`
	ProofMethod     string  `json:"proof_method"       binding:"required,oneof=wallet deposit"`
	ProofAmountUSDC float64 `json:"proof_amount_usdc"  binding:"required,gt=0"`
}

// RequestAccess — buyer submits proof-of-funds and NDA to gain data room access.
func (h *Handler) RequestAccess(c *gin.Context) {
	claims := middleware.GetClaims(c)
	listingID, valid := parseUUID(c, "id")
	if !valid {
		return
	}

	var req requestAccessBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	// Wallet-based proof: hit the Hedera mirror node to verify the balance.
	proofStatus := "pending"
	if req.ProofMethod == "wallet" {
		var hederaAccountID string
		_ = h.db.QueryRow(context.Background(),
			`SELECT COALESCE(hedera_account_id,'') FROM users WHERE id = $1`, claims.UserID).
			Scan(&hederaAccountID)

		if hederaAccountID == "" {
			fail(c, http.StatusBadRequest, "link a Hedera wallet before using wallet attestation")
			return
		}

		verified, _, err := h.hedera.CheckProofOfFunds(hederaAccountID, req.ProofAmountUSDC)
		if err != nil {
			// Mirror node unreachable — leave status pending, backend can retry.
			proofStatus = "pending"
		} else if verified {
			proofStatus = "verified"
		} else {
			proofStatus = "failed"
		}
	}

	var ar model.AccessRequest
	err := h.db.QueryRow(context.Background(), `
		INSERT INTO access_requests (listing_id, buyer_id, nda_signed, proof_of_funds_status, proof_amount_usdc, proof_method)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (listing_id, buyer_id) DO NOTHING
		RETURNING id, listing_id, buyer_id, nda_signed, proof_of_funds_status,
		          COALESCE(proof_amount_usdc,0), COALESCE(proof_method,''),
		          seller_decision, COALESCE(access_level,''), requested_at, decided_at
	`, listingID, claims.UserID, req.NDASigned, proofStatus, req.ProofAmountUSDC, req.ProofMethod).
		Scan(&ar.ID, &ar.ListingID, &ar.BuyerID, &ar.NDASignied, &ar.ProofOfFundsStatus,
			&ar.ProofAmountUSDC, &ar.ProofMethod, &ar.SellerDecision, &ar.AccessLevel,
			&ar.RequestedAt, &ar.DecidedAt)
	if err == pgx.ErrNoRows {
		fail(c, http.StatusConflict, "access already requested for this listing")
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to create access request")
		return
	}

	created(c, ar)
}

// ListAccessRequests — seller sees all requests for one of their listings.
func (h *Handler) ListAccessRequests(c *gin.Context) {
	claims := middleware.GetClaims(c)
	listingID, valid := parseUUID(c, "id")
	if !valid {
		return
	}

	// Confirm the caller owns the listing (or is operator).
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
		SELECT id, listing_id, buyer_id, nda_signed, proof_of_funds_status,
		       COALESCE(proof_amount_usdc,0), COALESCE(proof_method,''),
		       seller_decision, COALESCE(access_level,''), requested_at, decided_at
		FROM access_requests WHERE listing_id = $1
		ORDER BY requested_at DESC
	`, listingID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	result := make([]model.AccessRequest, 0)
	for rows.Next() {
		var ar model.AccessRequest
		if err := rows.Scan(&ar.ID, &ar.ListingID, &ar.BuyerID, &ar.NDASignied,
			&ar.ProofOfFundsStatus, &ar.ProofAmountUSDC, &ar.ProofMethod,
			&ar.SellerDecision, &ar.AccessLevel, &ar.RequestedAt, &ar.DecidedAt); err != nil {
			continue
		}
		result = append(result, ar)
	}

	ok(c, result)
}

// MyAccessRequests — buyer sees all their own access requests.
func (h *Handler) MyAccessRequests(c *gin.Context) {
	claims := middleware.GetClaims(c)

	rows, err := h.db.Query(context.Background(), `
		SELECT id, listing_id, buyer_id, nda_signed, proof_of_funds_status,
		       COALESCE(proof_amount_usdc,0), COALESCE(proof_method,''),
		       seller_decision, COALESCE(access_level,''), requested_at, decided_at
		FROM access_requests WHERE buyer_id = $1
		ORDER BY requested_at DESC
	`, claims.UserID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	result := make([]model.AccessRequest, 0)
	for rows.Next() {
		var ar model.AccessRequest
		if err := rows.Scan(&ar.ID, &ar.ListingID, &ar.BuyerID, &ar.NDASignied,
			&ar.ProofOfFundsStatus, &ar.ProofAmountUSDC, &ar.ProofMethod,
			&ar.SellerDecision, &ar.AccessLevel, &ar.RequestedAt, &ar.DecidedAt); err != nil {
			continue
		}
		result = append(result, ar)
	}

	ok(c, result)
}

type decideAccessBody struct {
	Decision    string `json:"decision"     binding:"required,oneof=approved denied"`
	AccessLevel string `json:"access_level"`
}

// DecideAccess — seller approves or denies a buyer's access request.
func (h *Handler) DecideAccess(c *gin.Context) {
	claims := middleware.GetClaims(c)
	requestID, valid := parseUUID(c, "id")
	if !valid {
		return
	}

	var req decideAccessBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify the caller owns the listing associated with this request.
	var sellerID string
	if err := h.db.QueryRow(context.Background(), `
		SELECT l.seller_id FROM access_requests ar
		JOIN listings l ON l.id = ar.listing_id
		WHERE ar.id = $1
	`, requestID).Scan(&sellerID); err != nil {
		fail(c, http.StatusNotFound, "access request not found")
		return
	}
	if sellerID != claims.UserID.String() && claims.Role != "operator" {
		fail(c, http.StatusForbidden, "not your listing")
		return
	}

	now := time.Now()
	var ar model.AccessRequest
	err := h.db.QueryRow(context.Background(), `
		UPDATE access_requests
		SET seller_decision = $1,
		    access_level    = CASE WHEN $1 = 'approved' THEN $2 ELSE NULL END,
		    decided_at      = $3
		WHERE id = $4
		RETURNING id, listing_id, buyer_id, nda_signed, proof_of_funds_status,
		          COALESCE(proof_amount_usdc,0), COALESCE(proof_method,''),
		          seller_decision, COALESCE(access_level,''), requested_at, decided_at
	`, req.Decision, req.AccessLevel, now, requestID).
		Scan(&ar.ID, &ar.ListingID, &ar.BuyerID, &ar.NDASignied, &ar.ProofOfFundsStatus,
			&ar.ProofAmountUSDC, &ar.ProofMethod, &ar.SellerDecision, &ar.AccessLevel,
			&ar.RequestedAt, &ar.DecidedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "update failed")
		return
	}

	ok(c, ar)
}
