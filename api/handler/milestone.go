package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/meridian-mkt/api/model"
)

func (h *Handler) ListMilestones(c *gin.Context) {
	projectID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT id, project_id, title, description, amount, order_index, status, created_at
		FROM milestones WHERE project_id = $1 ORDER BY order_index
	`, projectID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	milestones := make([]model.Milestone, 0)
	for rows.Next() {
		var ms model.Milestone
		if err := rows.Scan(&ms.ID, &ms.ProjectID, &ms.Title, &ms.Description,
			&ms.Amount, &ms.OrderIndex, &ms.Status, &ms.CreatedAt); err != nil {
			continue
		}
		milestones = append(milestones, ms)
	}

	ok(c, milestones)
}

func (h *Handler) GetMilestone(c *gin.Context) {
	id, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var ms model.Milestone
	err := h.db.QueryRow(context.Background(), `
		SELECT id, project_id, title, description, amount, order_index, status, created_at
		FROM milestones WHERE id = $1
	`, id).Scan(&ms.ID, &ms.ProjectID, &ms.Title, &ms.Description,
		&ms.Amount, &ms.OrderIndex, &ms.Status, &ms.CreatedAt)
	if err != nil {
		fail(c, http.StatusNotFound, "milestone not found")
		return
	}

	// Fetch proof submission if any
	var proof *model.ProofSubmission
	var p model.ProofSubmission
	perr := h.db.QueryRow(context.Background(), `
		SELECT id, milestone_id, organizer_id, COALESCE(text_update,''),
		       image_urls, doc_urls, file_hashes, submitted_at
		FROM proof_submissions WHERE milestone_id = $1
		ORDER BY submitted_at DESC LIMIT 1
	`, id).Scan(&p.ID, &p.MilestoneID, &p.OrganizerID, &p.TextUpdate,
		&p.ImageURLs, &p.DocURLs, &p.FileHashes, &p.SubmittedAt)
	if perr == nil {
		proof = &p
	}

	// Fetch approval if any
	var approval *model.Approval
	var a model.Approval
	aerr := h.db.QueryRow(context.Background(), `
		SELECT id, milestone_id, verifier_id, decision, COALESCE(note,''),
		       COALESCE(approval_payload,''), COALESCE(kms_key_id,''),
		       COALESCE(kms_signature,''), COALESCE(hedera_tx_id,''), decided_at
		FROM approvals WHERE milestone_id = $1
	`, id).Scan(&a.ID, &a.MilestoneID, &a.VerifierID, &a.Decision, &a.Note,
		&a.ApprovalPayload, &a.KMSKeyID, &a.KMSSignature, &a.HederaTxID, &a.DecidedAt)
	if aerr == nil {
		approval = &a
	}

	ok(c, gin.H{"milestone": ms, "proof": proof, "approval": approval})
}
