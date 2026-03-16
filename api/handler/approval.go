package handler

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
	sprouthedera "github.com/meridian-mkt/hedera"
)

type approveRequest struct {
	Note string `json:"note"`
}

type rejectRequest struct {
	Note string `json:"note" binding:"required"`
}

func (h *Handler) ApproveMilestone(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims.Role != "verifier" && claims.Role != "admin" {
		fail(c, http.StatusForbidden, "only verifiers can approve milestones")
		return
	}

	milestoneID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var req approveRequest
	_ = c.ShouldBindJSON(&req)

	// Load milestone
	var ms model.Milestone
	var projectID string
	err := h.db.QueryRow(context.Background(), `
		SELECT m.id, m.project_id, m.title, m.amount, m.status,
		       p.id::text
		FROM milestones m
		JOIN projects p ON p.id = m.project_id
		WHERE m.id = $1
	`, milestoneID).Scan(&ms.ID, &ms.ProjectID, &ms.Title, &ms.Amount, &ms.Status, &projectID)
	if err != nil {
		fail(c, http.StatusNotFound, "milestone not found")
		return
	}
	if ms.Status != "submitted" {
		fail(c, http.StatusConflict, "milestone is not in submitted state")
		return
	}

	// Load latest proof submission
	var proofID string
	var proofOrganizerID string
	err = h.db.QueryRow(context.Background(), `
		SELECT id::text, organizer_id::text FROM proof_submissions
		WHERE milestone_id = $1
		ORDER BY submitted_at DESC LIMIT 1
	`, milestoneID).Scan(&proofID, &proofOrganizerID)
	if err != nil {
		fail(c, http.StatusBadRequest, "no proof submission found for this milestone")
		return
	}

	// Build approval payload for KMS signing
	payloadData := map[string]string{
		"milestone_id": milestoneID.String(),
		"proof_id":     proofID,
		"verifier_id":  claims.UserID.String(),
		"timestamp":    time.Now().UTC().Format(time.RFC3339),
	}
	payloadBytes, _ := json.Marshal(payloadData)

	// Hash payload
	hash := sha256.Sum256(payloadBytes)
	payloadHash := base64.StdEncoding.EncodeToString(hash[:])

	// Sign with AWS KMS
	var kmsKeyID, kmsSig string
	if h.kms != nil && h.kms.Enabled() {
		kmsKeyID, kmsSig, err = h.kms.SignApproval(payloadBytes)
		if err != nil {
			log.Printf("kms: sign failed for milestone %s: %v", milestoneID, err)
			// Non-fatal for demo — record error in note
			kmsSig = fmt.Sprintf("kms_error: %v", err)
		}
	} else {
		// Dev mode: mock signature
		kmsKeyID = "dev-mock-key"
		kmsSig = base64.StdEncoding.EncodeToString(hash[:])
	}

	// Insert approval
	var approval model.Approval
	err = h.db.QueryRow(context.Background(), `
		INSERT INTO approvals (milestone_id, verifier_id, decision, note, approval_payload, kms_key_id, kms_signature)
		VALUES ($1, $2, 'approved', $3, $4, $5, $6)
		RETURNING id, milestone_id, verifier_id, decision, COALESCE(note,''),
		          COALESCE(approval_payload,''), COALESCE(kms_key_id,''),
		          COALESCE(kms_signature,''), COALESCE(hedera_tx_id,''), decided_at
	`, milestoneID, claims.UserID, req.Note, string(payloadBytes), kmsKeyID, kmsSig).
		Scan(&approval.ID, &approval.MilestoneID, &approval.VerifierID,
			&approval.Decision, &approval.Note,
			&approval.ApprovalPayload, &approval.KMSKeyID,
			&approval.KMSSignature, &approval.HederaTxID, &approval.DecidedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to record approval")
		return
	}

	// Update milestone status
	_, err = h.db.Exec(context.Background(),
		`UPDATE milestones SET status = 'approved' WHERE id = $1`, milestoneID)
	if err != nil {
		log.Printf("warning: failed to update milestone status: %v", err)
	}

	// Update project amount_released
	_, err = h.db.Exec(context.Background(),
		`UPDATE projects SET amount_released = amount_released + $1 WHERE id = $2`,
		ms.Amount, ms.ProjectID)
	if err != nil {
		log.Printf("warning: failed to update project amount_released: %v", err)
	}

	// Async: HCS events + HBAR release
	approvalID := approval.ID.String()
	go func() {
		var topicID, escrowAccount string
		h.db.QueryRow(context.Background(), `
			SELECT COALESCE(hcs_topic_id,''), COALESCE(hedera_escrow_account,'')
			FROM projects WHERE id = $1
		`, projectID).Scan(&topicID, &escrowAccount)

		// Log MILESTONE_APPROVED to HCS
		if topicID != "" {
			_ = h.hedera.LogEvent(topicID, sprouthedera.EventMilestoneApproved, projectID, map[string]string{
				"milestone_id":  milestoneID.String(),
				"kms_key_id":    kmsKeyID,
				"kms_signature": kmsSig[:min(len(kmsSig), 40)] + "...",
				"payload_hash":  payloadHash,
			})
		}

		// Release HBAR to organizer (1 HBAR per unit for demo)
		if escrowAccount != "" && proofOrganizerID != "" {
			// Get organizer's Hedera account (if linked) or skip
			var orgHederaAccount *string
			h.db.QueryRow(context.Background(), `
				SELECT hedera_account_id FROM users WHERE id = $1
			`, proofOrganizerID).Scan(&orgHederaAccount)

			if orgHederaAccount != nil && *orgHederaAccount != "" {
				// Convert amount (USD cents or units) to tinybars for demo
				// 1 unit = 100_000 tinybars (0.001 HBAR) for demo purposes
				amountTinybar := int64(ms.Amount * 100_000)
				txID, err := h.hedera.ReleaseToOrganizer(escrowAccount, *orgHederaAccount, amountTinybar)
				if err != nil {
					log.Printf("hedera: release failed for milestone %s: %v", milestoneID, err)
				} else {
					// Update approval with tx ID
					h.db.Exec(context.Background(),
						`UPDATE approvals SET hedera_tx_id = $1 WHERE id = $2`,
						txID, approvalID)

					// Log FUNDS_RELEASED to HCS
					if topicID != "" {
						_ = h.hedera.LogEvent(topicID, sprouthedera.EventFundsReleased, projectID, map[string]string{
							"milestone_id":        milestoneID.String(),
							"hedera_tx_id":        txID,
							"organizer_account_id": *orgHederaAccount,
						})
					}
				}
			}
		}
	}()

	ok(c, gin.H{"approval": approval, "payload_hash": payloadHash})
}

func (h *Handler) RejectMilestone(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims.Role != "verifier" && claims.Role != "admin" {
		fail(c, http.StatusForbidden, "only verifiers can reject milestones")
		return
	}

	milestoneID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var req rejectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify milestone is in submitted state
	var ms model.Milestone
	var projectID string
	err := h.db.QueryRow(context.Background(), `
		SELECT m.status, m.project_id::text
		FROM milestones m WHERE m.id = $1
	`, milestoneID).Scan(&ms.Status, &projectID)
	if err != nil {
		fail(c, http.StatusNotFound, "milestone not found")
		return
	}
	if ms.Status != "submitted" {
		fail(c, http.StatusConflict, "milestone is not in submitted state")
		return
	}

	var approval model.Approval
	err = h.db.QueryRow(context.Background(), `
		INSERT INTO approvals (milestone_id, verifier_id, decision, note)
		VALUES ($1, $2, 'rejected', $3)
		RETURNING id, milestone_id, verifier_id, decision, COALESCE(note,''),
		          COALESCE(approval_payload,''), COALESCE(kms_key_id,''),
		          COALESCE(kms_signature,''), COALESCE(hedera_tx_id,''), decided_at
	`, milestoneID, claims.UserID, req.Note).
		Scan(&approval.ID, &approval.MilestoneID, &approval.VerifierID,
			&approval.Decision, &approval.Note,
			&approval.ApprovalPayload, &approval.KMSKeyID,
			&approval.KMSSignature, &approval.HederaTxID, &approval.DecidedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to record rejection")
		return
	}

	// Update milestone status back to rejected (organizer can resubmit)
	_, _ = h.db.Exec(context.Background(),
		`UPDATE milestones SET status = 'rejected' WHERE id = $1`, milestoneID)

	// Async: log to HCS
	go func() {
		var topicID string
		h.db.QueryRow(context.Background(), `
			SELECT COALESCE(hcs_topic_id,'') FROM projects WHERE id = $1
		`, projectID).Scan(&topicID)

		if topicID == "" {
			return
		}
		_ = h.hedera.LogEvent(topicID, sprouthedera.EventMilestoneRejected, projectID, map[string]string{
			"milestone_id": milestoneID.String(),
			"verifier_id":  claims.UserID.String(),
		})
	}()

	ok(c, approval)
}

