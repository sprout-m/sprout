package handler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
	meridianhedera "github.com/meridian-mkt/hedera"
)

// initEscrow is called (often in a goroutine) when an offer is accepted or when
// ProvisionEscrow retries setup. It looks up the stored Hedera public keys for
// both the buyer and seller from the users table, then creates the 2-of-3
// threshold escrow account on-chain.
//
// Using the stored hedera_public_key (set at LinkWallet time) instead of
// re-fetching from the mirror node guarantees that the key baked into the
// escrow's threshold list is exactly the key HashPack will present when signing.
func (h *Handler) initEscrow(offerID uuid.UUID) error {
	ctx := context.Background()
	tag := fmt.Sprintf("initEscrow(offer=%s)", offerID)

	// Fetch buyer and seller Hedera public keys from the users table.
	// These are populated when each user links their wallet via /auth/link-wallet.
	var buyerPubKey, sellerPubKey string
	err := h.db.QueryRow(ctx, `
		SELECT COALESCE(buyer.hedera_public_key,''), COALESCE(seller.hedera_public_key,'')
		FROM offers o
		JOIN listings l ON l.id = o.listing_id
		JOIN users buyer  ON buyer.id  = o.buyer_id
		JOIN users seller ON seller.id = l.seller_id
		WHERE o.id = $1
	`, offerID).Scan(&buyerPubKey, &sellerPubKey)
	if err != nil {
		log.Printf("%s: fetch user keys: %v", tag, err)
		return fmt.Errorf("could not load user keys: %w", err)
	}
	if buyerPubKey == "" {
		return fmt.Errorf("buyer has not linked a Hedera wallet — escrow cannot be provisioned")
	}
	if sellerPubKey == "" {
		return fmt.Errorf("seller has not linked a Hedera wallet — escrow cannot be provisioned")
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

	var offerID uuid.UUID
	var hederaAccountID string

	err := h.db.QueryRow(context.Background(), `
		SELECT e.offer_id, COALESCE(e.hedera_account_id,'')
		FROM escrows e
		JOIN offers o   ON o.id = e.offer_id
		JOIN listings l ON l.id = o.listing_id
		WHERE e.id = $1 AND (o.buyer_id = $2 OR l.seller_id = $2 OR $3 = 'operator')
	`, escrowID, claims.UserID, claims.Role).
		Scan(&offerID, &hederaAccountID)
	if err != nil {
		fail(c, http.StatusNotFound, "escrow not found")
		return
	}

	// Allow force-reprovision (e.g. after fixing the platform key mismatch) by
	// passing ?force=true.  Without the flag, skip if already provisioned.
	if hederaAccountID != "" && c.Query("force") != "true" {
		ok(c, gin.H{"hedera_account_id": hederaAccountID, "already_provisioned": true})
		return
	}

	if err := h.initEscrow(offerID); err != nil {
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

// ScheduleRelease — buyer or operator schedules an on-chain USDC release to the seller.
// The platform's signature (1-of-3) is attached automatically when the schedule is created.
// The buyer must then co-sign via CompleteRelease to execute the transfer on-chain.
// Operators can call this to initiate release; they follow up with CompleteRelease (force mode).
func (h *Handler) ScheduleRelease(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims.Role != "operator" && claims.Role != "buyer" {
		fail(c, http.StatusForbidden, "buyer or operator only")
		return
	}

	escrowID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	// Load escrow + seller Hedera account.
	// Buyers can only initiate release for their own escrow.
	var e model.Escrow
	var sellerHederaID string
	err := h.db.QueryRow(context.Background(), `
		SELECT e.id, e.offer_id, e.hedera_account_id, e.hcs_topic_id, e.amount_usdc, e.status,
		       u.hedera_account_id AS seller_hedera_id
		FROM escrows e
		JOIN offers o ON o.id = e.offer_id
		JOIN listings l ON l.id = o.listing_id
		JOIN users u ON u.id = l.seller_id
		WHERE e.id = $1 AND (o.buyer_id = $2 OR $3 = 'operator')
	`, escrowID, claims.UserID, claims.Role).Scan(&e.ID, &e.OfferID, &e.HederaAccountID, &e.HCSTopicID,
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

	if h.hedera != nil {
		// Best-effort USDC association check. Log the result for diagnostics but
		// do not hard-block — CompleteRelease will catch an actual failure via the
		// post-execution balance check.
		associated, err := h.hedera.IsUSDCAssociated(sellerHederaID)
		if err != nil {
			log.Printf("ScheduleRelease: USDC association check error (seller=%s): %v — proceeding anyway", sellerHederaID, err)
		} else if !associated {
			log.Printf("ScheduleRelease: USDC association check returned false for seller=%s — proceeding anyway; verify token ID and account on mirror node", sellerHederaID)
		} else {
			log.Printf("ScheduleRelease: seller=%s USDC association confirmed", sellerHederaID)
		}

		// Verify the escrow account actually holds the USDC. This catches the case
		// where the escrow was force-reprovisioned (new account) but the buyer
		// deposited to the old account — the inner scheduled transfer would fail
		// silently with INSUFFICIENT_TOKEN_BALANCE otherwise.
		hasFunds, actualUSDC, err := h.hedera.CheckProofOfFunds(e.HederaAccountID, e.AmountUSDC)
		if err != nil {
			fail(c, http.StatusInternalServerError, "could not verify escrow balance: "+err.Error())
			return
		}
		if !hasFunds {
			fail(c, http.StatusConflict, fmt.Sprintf(
				"escrow account has insufficient USDC (has %.2f, needs %.2f) — the buyer may need to re-deposit to the current escrow account",
				actualUSDC, e.AmountUSDC,
			))
			return
		}
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

// CompleteRelease — finalises the escrow after funds have been released on-chain.
//
// Buyer path: called after the buyer has co-signed the Hedera Scheduled Transaction
// via their wallet. The backend confirms the schedule executed on the mirror node
// before marking the escrow as completed.
//
// Operator (force) path: skips the on-chain check and marks completed immediately.
// Used for admin overrides where the operator handles the USDC transfer out-of-band.
func (h *Handler) CompleteRelease(c *gin.Context) {
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
		WHERE e.id = $1 AND (o.buyer_id = $2 OR $3 = 'operator')
	`, escrowID, claims.UserID, claims.Role).
		Scan(&e.ID, &e.OfferID, &e.HederaAccountID, &e.HCSTopicID,
			&e.ScheduleID, &e.BuyerDepositTx, &e.SellerTransferTx,
			&e.AmountUSDC, &e.Status, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		fail(c, http.StatusNotFound, "escrow not found or not authorised")
		return
	}
	if e.Status != "releaseScheduled" {
		fail(c, http.StatusConflict, "escrow is not awaiting release confirmation (status: "+e.Status+")")
		return
	}

	// Buyer path: verify the Hedera Scheduled Transaction has executed on-chain.
	// The mirror node can lag 10–30 s behind consensus on testnet; retry up to ~60 s.
	if claims.Role != "operator" && e.ScheduleID != "" && h.hedera != nil {
		const maxAttempts = 12
		const retryDelay = 5 * time.Second
		var info *meridianhedera.ScheduleInfo
		for i := 0; i < maxAttempts; i++ {
			var err error
			info, err = h.hedera.GetScheduleStatus(e.ScheduleID)
			if err != nil {
				fail(c, http.StatusInternalServerError, "could not verify schedule status: "+err.Error())
				return
			}
			if info.Executed != "" {
				break
			}
			if i < maxAttempts-1 {
				time.Sleep(retryDelay)
			}
		}
		if info == nil || info.Executed == "" {
			log.Printf("CompleteRelease: schedule %s not executed after %d attempts; signatories: %+v",
				e.ScheduleID, maxAttempts, info.Signatories)
			fail(c, http.StatusConflict, "scheduled transaction has not executed yet — sign it via your wallet first")
			return
		}

		// Brief pause: the mirror node may index executed_timestamp before it
		// reflects the updated token balance. Give it a few seconds to catch up.
		time.Sleep(5 * time.Second)

		// The schedule executed (threshold met), but the inner TransferTransaction
		// can still fail silently (e.g. INSUFFICIENT_TOKEN_BALANCE). Verify the
		// USDC actually left the escrow account before declaring success.
		if e.HederaAccountID != "" {
			stillHasFunds, _, balErr := h.hedera.CheckProofOfFunds(e.HederaAccountID, e.AmountUSDC)
			if balErr == nil && stillHasFunds {
				// Fetch the exact on-chain error code so we know what to fix.
				innerResult, innerErr := h.hedera.GetScheduledTransactionResult(info.Executed)
				if innerErr != nil {
					log.Printf("CompleteRelease: inner tx query error: %v", innerErr)
				}

				recentTxs, recentErr := h.hedera.GetRecentAccountTransactions(e.HederaAccountID, 10)
				if recentErr != nil {
					log.Printf("CompleteRelease: account tx query error: %v", recentErr)
				}

				log.Printf("CompleteRelease: schedule %s (executed_timestamp=%s) — escrow %s still holds %.2f USDC — inner tx result: %q — recent escrow txs: %+v — schedule sigs: %+v",
					e.ScheduleID, info.Executed, e.HederaAccountID, e.AmountUSDC, innerResult, recentTxs, info.Signatories)

				msg := "the scheduled transaction executed but the USDC transfer failed on-chain"
				if innerResult != "" {
					msg += " (" + innerResult + ")"
				}
				fail(c, http.StatusConflict, msg)
				return
			}
		}
	}

	if _, err := h.db.Exec(context.Background(), `
		UPDATE escrows SET status = 'completed', updated_at = NOW() WHERE id = $1
	`, escrowID); err != nil {
		fail(c, http.StatusInternalServerError, "update failed")
		return
	}

	if e.HCSTopicID != "" {
		go h.hedera.LogEvent(e.HCSTopicID, meridianhedera.EventDealClosed, e.OfferID.String(),
			map[string]string{"schedule_id": e.ScheduleID})
	}

	e.Status = "completed"
	ok(c, e)
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
