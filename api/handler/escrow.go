package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
	meridianhedera "github.com/meridian-mkt/hedera"
)

// initEscrow is called in a goroutine when an offer is accepted.
// It creates the on-chain escrow account and HCS topic, then writes both
// IDs back to the escrows row.
func (h *Handler) initEscrow(offerID, listingID, buyerID uuid.UUID, amountUSDC float64) error {
	ctx := context.Background()
	tag := fmt.Sprintf("initEscrow(offer=%s)", offerID)

	var buyerHederaID, sellerHederaID string
	if err := h.db.QueryRow(ctx, `
		SELECT COALESCE(u.hedera_account_id,'') FROM users u
		JOIN offers o ON o.buyer_id = u.id
		WHERE o.id = $1
	`, offerID).Scan(&buyerHederaID); err != nil || buyerHederaID == "" {
		log.Printf("%s: buyer has no linked Hedera wallet", tag)
		return fmt.Errorf("buyer has not linked a Hedera wallet")
	}

	if err := h.db.QueryRow(ctx, `
		SELECT COALESCE(u.hedera_account_id,'') FROM users u
		JOIN listings l ON l.seller_id = u.id
		WHERE l.id = $1
	`, listingID).Scan(&sellerHederaID); err != nil || sellerHederaID == "" {
		log.Printf("%s: seller has no linked Hedera wallet", tag)
		return fmt.Errorf("seller has not linked a Hedera wallet")
	}

	buyerPubKey, err := h.hedera.GetAccountPublicKey(buyerHederaID)
	if err != nil {
		log.Printf("%s: GetAccountPublicKey(buyer): %v", tag, err)
		return fmt.Errorf("could not fetch buyer public key: %w", err)
	}
	sellerPubKey, err := h.hedera.GetAccountPublicKey(sellerHederaID)
	if err != nil {
		log.Printf("%s: GetAccountPublicKey(seller): %v", tag, err)
		return fmt.Errorf("could not fetch seller public key: %w", err)
	}

	result, err := h.hedera.CreateEscrow(offerID.String(), buyerPubKey, sellerPubKey)
	if err != nil {
		log.Printf("%s: CreateEscrow: %v", tag, err)
		return fmt.Errorf("on-chain escrow creation failed: %w", err)
	}

	if _, err := h.db.Exec(ctx, `
		UPDATE escrows
		SET hedera_account_id = $1, hcs_topic_id = $2, updated_at = NOW()
		WHERE offer_id = $3
	`, result.HederaAccountID, result.HCSTopicID, offerID); err != nil {
		log.Printf("%s: update hedera IDs: %v", tag, err)
		return fmt.Errorf("failed to save escrow IDs: %w", err)
	}

	return nil
}

// ProvisionEscrow retries the Hedera escrow account setup for a deal that
// was created before both parties had linked their wallets.
func (h *Handler) ProvisionEscrow(c *gin.Context) {
	claims := middleware.GetClaims(c)
	escrowID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var offerID, listingID, buyerID uuid.UUID
	var amountUSDC float64
	var hederaAccountID string

	err := h.db.QueryRow(context.Background(), `
		SELECT e.offer_id, o.listing_id, o.buyer_id, e.amount_usdc,
		       COALESCE(e.hedera_account_id,'')
		FROM escrows e
		JOIN offers o   ON o.id = e.offer_id
		JOIN listings l ON l.id = o.listing_id
		WHERE e.id = $1 AND (o.buyer_id = $2 OR l.seller_id = $2 OR $3 = 'operator')
	`, escrowID, claims.UserID, claims.Role).
		Scan(&offerID, &listingID, &buyerID, &amountUSDC, &hederaAccountID)
	if err != nil {
		fail(c, http.StatusNotFound, "escrow not found")
		return
	}

	if hederaAccountID != "" {
		ok(c, gin.H{"hedera_account_id": hederaAccountID, "already_provisioned": true})
		return
	}

	if err := h.initEscrow(offerID, listingID, buyerID, amountUSDC); err != nil {
		fail(c, http.StatusConflict, err.Error())
		return
	}

	// Return the updated escrow.
	var e model.Escrow
	h.db.QueryRow(context.Background(), `
		SELECT e.id, e.offer_id, COALESCE(e.hedera_account_id,''), COALESCE(e.hcs_topic_id,''),
		       COALESCE(e.schedule_id,''), COALESCE(e.buyer_deposit_tx,''), COALESCE(e.seller_transfer_tx,''),
		       e.amount_usdc, e.status, e.created_at, e.updated_at
		FROM escrows e WHERE e.id = $1
	`, escrowID).Scan(&e.ID, &e.OfferID, &e.HederaAccountID, &e.HCSTopicID,
		&e.ScheduleID, &e.BuyerDepositTx, &e.SellerTransferTx,
		&e.AmountUSDC, &e.Status, &e.CreatedAt, &e.UpdatedAt)

	ok(c, e)
}

// MyEscrows returns all escrows the authenticated user is a party to.
func (h *Handler) MyEscrows(c *gin.Context) {
	claims := middleware.GetClaims(c)

	rows, err := h.db.Query(context.Background(), `
		SELECT e.id, e.offer_id, COALESCE(e.hedera_account_id,''), COALESCE(e.hcs_topic_id,''),
		       COALESCE(e.schedule_id,''), COALESCE(e.buyer_deposit_tx,''), COALESCE(e.seller_transfer_tx,''),
		       e.amount_usdc, e.status, e.created_at, e.updated_at
		FROM escrows e
		JOIN offers o ON o.id = e.offer_id
		JOIN listings l ON l.id = o.listing_id
		WHERE o.buyer_id = $1 OR l.seller_id = $1 OR $2 = 'operator'
		ORDER BY e.created_at DESC
	`, claims.UserID, claims.Role)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	ok(c, scanEscrows(rows))
}

// GetEscrow returns a single escrow by ID.
func (h *Handler) GetEscrow(c *gin.Context) {
	claims := middleware.GetClaims(c)
	escrowID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var e model.Escrow
	err := h.db.QueryRow(context.Background(), `
		SELECT e.id, e.offer_id, COALESCE(e.hedera_account_id,''), COALESCE(e.hcs_topic_id,''),
		       COALESCE(e.schedule_id,''), COALESCE(e.buyer_deposit_tx,''), COALESCE(e.seller_transfer_tx,''),
		       e.amount_usdc, e.status, e.created_at, e.updated_at
		FROM escrows e
		JOIN offers o ON o.id = e.offer_id
		JOIN listings l ON l.id = o.listing_id
		WHERE e.id = $1 AND (o.buyer_id = $2 OR l.seller_id = $2 OR $3 = 'operator')
	`, escrowID, claims.UserID, claims.Role).
		Scan(&e.ID, &e.OfferID, &e.HederaAccountID, &e.HCSTopicID,
			&e.ScheduleID, &e.BuyerDepositTx, &e.SellerTransferTx,
			&e.AmountUSDC, &e.Status, &e.CreatedAt, &e.UpdatedAt)
	if err == pgx.ErrNoRows {
		fail(c, http.StatusNotFound, "escrow not found")
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}

	ok(c, e)
}

type confirmDepositBody struct {
	TransactionID string `json:"transaction_id" binding:"required"`
}

// ConfirmDeposit — buyer notifies the backend that they've deposited USDC on-chain.
// The backend records the transaction ID and advances the escrow status.
// In production, you'd also verify the tx on the mirror node before accepting.
func (h *Handler) ConfirmDeposit(c *gin.Context) {
	claims := middleware.GetClaims(c)
	escrowID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var req confirmDepositBody
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	// Only the buyer of this offer can confirm deposit.
	var buyerID string
	if err := h.db.QueryRow(context.Background(), `
		SELECT o.buyer_id FROM escrows e JOIN offers o ON o.id = e.offer_id WHERE e.id = $1
	`, escrowID).Scan(&buyerID); err != nil {
		fail(c, http.StatusNotFound, "escrow not found")
		return
	}
	if buyerID != claims.UserID.String() {
		fail(c, http.StatusForbidden, "only the buyer can confirm deposit")
		return
	}

	var e model.Escrow
	err := h.db.QueryRow(context.Background(), `
		UPDATE escrows
		SET buyer_deposit_tx = $1, status = 'funded', updated_at = NOW()
		WHERE id = $2 AND status = 'awaitingDeposit'
		RETURNING id, offer_id, COALESCE(hedera_account_id,''), COALESCE(hcs_topic_id,''),
		          COALESCE(schedule_id,''), COALESCE(buyer_deposit_tx,''), COALESCE(seller_transfer_tx,''),
		          amount_usdc, status, created_at, updated_at
	`, req.TransactionID, escrowID).
		Scan(&e.ID, &e.OfferID, &e.HederaAccountID, &e.HCSTopicID,
			&e.ScheduleID, &e.BuyerDepositTx, &e.SellerTransferTx,
			&e.AmountUSDC, &e.Status, &e.CreatedAt, &e.UpdatedAt)
	if err == pgx.ErrNoRows {
		fail(c, http.StatusConflict, "escrow is not awaiting deposit")
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "update failed")
		return
	}

	// Log to HCS.
	if e.HCSTopicID != "" {
		go h.hedera.LogEvent(e.HCSTopicID, meridianhedera.EventEscrowFunded, e.OfferID.String(),
			map[string]string{"transaction_id": req.TransactionID})
	}

	ok(c, e)
}

// ScheduleRelease — operator creates the on-chain scheduled release.
// Returns the ScheduleID which must be co-signed by the buyer via their wallet.
func (h *Handler) ScheduleRelease(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims.Role != "operator" {
		fail(c, http.StatusForbidden, "operator only")
		return
	}

	escrowID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	// Load escrow + seller Hedera account.
	var e model.Escrow
	var sellerHederaID string
	err := h.db.QueryRow(context.Background(), `
		SELECT e.id, e.offer_id, e.hedera_account_id, e.hcs_topic_id, e.amount_usdc, e.status,
		       u.hedera_account_id AS seller_hedera_id
		FROM escrows e
		JOIN offers o ON o.id = e.offer_id
		JOIN listings l ON l.id = o.listing_id
		JOIN users u ON u.id = l.seller_id
		WHERE e.id = $1
	`, escrowID).Scan(&e.ID, &e.OfferID, &e.HederaAccountID, &e.HCSTopicID,
		&e.AmountUSDC, &e.Status, &sellerHederaID)
	if err != nil {
		fail(c, http.StatusNotFound, "escrow not found")
		return
	}
	if e.Status != "funded" {
		fail(c, http.StatusConflict, "escrow must be funded before scheduling release")
		return
	}
	if e.HederaAccountID == "" || sellerHederaID == "" {
		fail(c, http.StatusConflict, "escrow account or seller wallet not set up")
		return
	}

	scheduleID, err := h.hedera.ScheduleRelease(e.HederaAccountID, sellerHederaID, e.AmountUSDC, e.OfferID.String())
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to schedule release: "+err.Error())
		return
	}

	h.db.Exec(context.Background(), `
		UPDATE escrows SET schedule_id = $1, status = 'releaseScheduled', updated_at = NOW()
		WHERE id = $2
	`, scheduleID, escrowID)

	if e.HCSTopicID != "" {
		go h.hedera.LogEvent(e.HCSTopicID, meridianhedera.EventReleaseScheduled, e.OfferID.String(),
			map[string]string{"schedule_id": scheduleID})
	}

	ok(c, gin.H{"schedule_id": scheduleID, "status": "releaseScheduled"})
}

// OpenDispute — buyer or seller flags a dispute on a funded escrow.
func (h *Handler) OpenDispute(c *gin.Context) {
	claims := middleware.GetClaims(c)
	escrowID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var e model.Escrow
	var hcsTopicID, offerIDStr string
	err := h.db.QueryRow(context.Background(), `
		SELECT e.id, e.offer_id, COALESCE(e.hcs_topic_id,''), e.status,
		       e.amount_usdc, e.created_at, e.updated_at
		FROM escrows e
		JOIN offers o ON o.id = e.offer_id
		JOIN listings l ON l.id = o.listing_id
		WHERE e.id = $1 AND (o.buyer_id = $2 OR l.seller_id = $2)
	`, escrowID, claims.UserID).
		Scan(&e.ID, &e.OfferID, &hcsTopicID, &e.Status, &e.AmountUSDC, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		fail(c, http.StatusNotFound, "escrow not found or you are not a party")
		return
	}
	if e.Status == "completed" || e.Status == "disputed" || e.Status == "refunded" {
		fail(c, http.StatusConflict, "cannot open dispute on escrow with status: "+e.Status)
		return
	}

	offerIDStr = e.OfferID.String()
	h.db.Exec(context.Background(),
		`UPDATE escrows SET status = 'disputed', updated_at = NOW() WHERE id = $1`, escrowID)

	if hcsTopicID != "" {
		go h.hedera.LogEvent(hcsTopicID, meridianhedera.EventDisputeOpened, offerIDStr,
			map[string]string{"raised_by": claims.UserID.String()})
	}

	ok(c, gin.H{"status": "disputed", "escrow_id": escrowID})
}

// GetDealEvents returns the HCS audit trail for an escrow's deal topic.
func (h *Handler) GetDealEvents(c *gin.Context) {
	claims := middleware.GetClaims(c)
	escrowID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var hcsTopicID string
	err := h.db.QueryRow(context.Background(), `
		SELECT COALESCE(e.hcs_topic_id,'') FROM escrows e
		JOIN offers o ON o.id = e.offer_id
		JOIN listings l ON l.id = o.listing_id
		WHERE e.id = $1 AND (o.buyer_id = $2 OR l.seller_id = $2 OR $3 = 'operator')
	`, escrowID, claims.UserID, claims.Role).Scan(&hcsTopicID)
	if err != nil {
		fail(c, http.StatusNotFound, "escrow not found")
		return
	}
	if hcsTopicID == "" {
		ok(c, []any{})
		return
	}

	events, err := h.hedera.GetDealEvents(hcsTopicID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to fetch deal events: "+err.Error())
		return
	}

	ok(c, events)
}

// TransferNFT — seller signals completion by transferring the listing NFT to the buyer.
// The platform operator account holds the NFT (minted there at listing creation) and
// executes the on-chain transfer on the seller's behalf using the operator key.
func (h *Handler) TransferNFT(c *gin.Context) {
	claims := middleware.GetClaims(c)
	escrowID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var (
		serialNumber int64
		hcsTopicID   string
		offerIDStr   string
		escrowStatus string
		buyerHedera  string
		sellerID     uuid.UUID
	)

	err := h.db.QueryRow(context.Background(), `
		SELECT l.nft_serial_number, COALESCE(e.hcs_topic_id,''), e.offer_id::text,
		       e.status, COALESCE(buyer.hedera_account_id,''), l.seller_id
		FROM escrows e
		JOIN offers   o    ON o.id    = e.offer_id
		JOIN listings l    ON l.id    = o.listing_id
		JOIN users    buyer ON buyer.id = o.buyer_id
		WHERE e.id = $1
	`, escrowID).Scan(&serialNumber, &hcsTopicID, &offerIDStr, &escrowStatus, &buyerHedera, &sellerID)
	if err != nil {
		fail(c, http.StatusNotFound, "escrow not found")
		return
	}

	if sellerID != claims.UserID {
		fail(c, http.StatusForbidden, "only the seller can transfer the listing NFT")
		return
	}
	if escrowStatus != "funded" && escrowStatus != "releaseScheduled" {
		fail(c, http.StatusConflict, "escrow must be funded before transferring NFT")
		return
	}
	if serialNumber == 0 {
		fail(c, http.StatusConflict, "no NFT has been minted for this listing")
		return
	}
	if buyerHedera == "" {
		fail(c, http.StatusConflict, "buyer has not linked a Hedera wallet")
		return
	}
	if h.hedera == nil {
		fail(c, http.StatusServiceUnavailable, "Hedera service not configured")
		return
	}

	if err := h.hedera.TransferNFTFromPlatform(serialNumber, buyerHedera); err != nil {
		fail(c, http.StatusInternalServerError, "NFT transfer failed: "+err.Error())
		return
	}

	nftRef := fmt.Sprintf("nft:serial:%d->%s", serialNumber, buyerHedera)
	h.db.Exec(context.Background(), `
		UPDATE escrows SET seller_transfer_tx = $1, updated_at = NOW() WHERE id = $2
	`, nftRef, escrowID)

	if hcsTopicID != "" {
		go h.hedera.LogEvent(hcsTopicID, meridianhedera.EventNFTTransferred, offerIDStr,
			map[string]string{
				"to":     buyerHedera,
				"serial": fmt.Sprintf("%d", serialNumber),
			})
	}

	ok(c, gin.H{"seller_transfer_tx": nftRef, "status": escrowStatus})
}

func scanEscrows(rows interface {
	Next() bool
	Scan(...any) error
}) []model.Escrow {
	result := make([]model.Escrow, 0)
	for rows.Next() {
		var e model.Escrow
		if err := rows.Scan(&e.ID, &e.OfferID, &e.HederaAccountID, &e.HCSTopicID,
			&e.ScheduleID, &e.BuyerDepositTx, &e.SellerTransferTx,
			&e.AmountUSDC, &e.Status, &e.CreatedAt, &e.UpdatedAt); err != nil {
			continue
		}
		result = append(result, e)
	}
	return result
}
