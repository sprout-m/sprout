package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
)

// ListThreads returns all message threads the authenticated user is a party to.
func (h *Handler) ListThreads(c *gin.Context) {
	claims := middleware.GetClaims(c)

	rows, err := h.db.Query(context.Background(), `
		SELECT t.id, t.listing_id, t.buyer_id, t.seller_id,
		       COALESCE(buyer.handle, ''), COALESCE(seller.handle, ''),
		       COALESCE(t.title,''), t.created_at, t.updated_at
		FROM message_threads t
		JOIN users buyer  ON buyer.id = t.buyer_id
		JOIN users seller ON seller.id = t.seller_id
		WHERE t.buyer_id = $1 OR t.seller_id = $1
		ORDER BY t.updated_at DESC
	`, claims.UserID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	threads := make([]model.MessageThread, 0)
	for rows.Next() {
		var t model.MessageThread
		if err := rows.Scan(
			&t.ID, &t.ListingID, &t.BuyerID, &t.SellerID,
			&t.BuyerHandle, &t.SellerHandle, &t.Title, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			continue
		}
		threads = append(threads, t)
	}

	ok(c, threads)
}

type startThreadBody struct {
	ListingID uuid.UUID  `json:"listing_id" binding:"required"`
	SellerID  *uuid.UUID `json:"seller_id"` // provided by buyer
	BuyerID   *uuid.UUID `json:"buyer_id"`  // provided by seller
}

// StartThread opens a new message thread between a buyer and a seller.
// Buyers provide seller_id; sellers provide buyer_id. Upserts on conflict.
func (h *Handler) StartThread(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var req startThreadBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	var buyerID, sellerID uuid.UUID
	if req.BuyerID != nil {
		// Caller is the seller (or operator acting as seller).
		sellerID = claims.UserID
		buyerID = *req.BuyerID
	} else if req.SellerID != nil {
		// Caller is the buyer.
		buyerID = claims.UserID
		sellerID = *req.SellerID
	} else {
		fail(c, http.StatusBadRequest, "seller_id or buyer_id is required")
		return
	}

	// Build a title from the listing name and participant handles.
	var listingName, sellerHandle, buyerHandle string
	h.db.QueryRow(context.Background(),
		`SELECT anonymized_name FROM listings WHERE id = $1`, req.ListingID).Scan(&listingName)
	h.db.QueryRow(context.Background(),
		`SELECT handle FROM users WHERE id = $1`, buyerID).Scan(&buyerHandle)
	h.db.QueryRow(context.Background(),
		`SELECT handle FROM users WHERE id = $1`, sellerID).Scan(&sellerHandle)

	title := listingName + " · " + buyerHandle + " <> " + sellerHandle

	var t model.MessageThread
	err := h.db.QueryRow(context.Background(), `
		INSERT INTO message_threads (listing_id, buyer_id, seller_id, title)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (listing_id, buyer_id, seller_id) DO UPDATE SET updated_at = NOW()
		RETURNING id, listing_id, buyer_id, seller_id, COALESCE(title,''), created_at, updated_at
	`, req.ListingID, buyerID, sellerID, title).
		Scan(&t.ID, &t.ListingID, &t.BuyerID, &t.SellerID, &t.Title, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to create thread")
		return
	}
	t.BuyerHandle = buyerHandle
	t.SellerHandle = sellerHandle

	created(c, t)
}

// GetThread returns the messages in a thread.
func (h *Handler) GetThread(c *gin.Context) {
	claims := middleware.GetClaims(c)
	threadID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	// Verify access.
	var buyerID, sellerID string
	if err := h.db.QueryRow(context.Background(),
		`SELECT buyer_id, seller_id FROM message_threads WHERE id = $1`, threadID).
		Scan(&buyerID, &sellerID); err == pgx.ErrNoRows {
		fail(c, http.StatusNotFound, "thread not found")
		return
	}
	uid := claims.UserID.String()
	if uid != buyerID && uid != sellerID && claims.Role != "operator" {
		fail(c, http.StatusForbidden, "not your thread")
		return
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT m.id, m.thread_id, m.sender_id, COALESCE(u.handle, ''),
		       m.sender_type, m.body, m.created_at
		FROM messages m
		LEFT JOIN users u ON u.id = m.sender_id
		WHERE m.thread_id = $1
		ORDER BY m.created_at ASC
	`, threadID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	msgs := make([]model.Message, 0)
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.ID, &m.ThreadID, &m.SenderID, &m.SenderHandle, &m.SenderType, &m.Body, &m.CreatedAt); err != nil {
			continue
		}
		msgs = append(msgs, m)
	}

	ok(c, msgs)
}

type sendMessageBody struct {
	Body string `json:"body" binding:"required,min=1"`
}

// SendMessage posts a message to a thread.
func (h *Handler) SendMessage(c *gin.Context) {
	claims := middleware.GetClaims(c)
	threadID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var req sendMessageBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify the caller is a party to the thread.
	var buyerID, sellerID string
	if err := h.db.QueryRow(context.Background(),
		`SELECT buyer_id, seller_id FROM message_threads WHERE id = $1`, threadID).
		Scan(&buyerID, &sellerID); err == pgx.ErrNoRows {
		fail(c, http.StatusNotFound, "thread not found")
		return
	}
	uid := claims.UserID.String()
	if uid != buyerID && uid != sellerID && claims.Role != "operator" {
		fail(c, http.StatusForbidden, "not your thread")
		return
	}

	senderID := claims.UserID
	var m model.Message
	err := h.db.QueryRow(context.Background(), `
		INSERT INTO messages (thread_id, sender_id, sender_type, body)
		VALUES ($1, $2, 'user', $3)
		RETURNING id, thread_id, sender_id, sender_type, body, created_at,
		          COALESCE((SELECT handle FROM users WHERE id = $2), '')
	`, threadID, senderID, req.Body).
		Scan(&m.ID, &m.ThreadID, &m.SenderID, &m.SenderType, &m.Body, &m.CreatedAt, &m.SenderHandle)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to send message")
		return
	}

	// Bump thread updated_at.
	h.db.Exec(context.Background(),
		`UPDATE message_threads SET updated_at = NOW() WHERE id = $1`, threadID)

	created(c, m)
}
