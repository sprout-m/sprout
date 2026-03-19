package handler

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
	sprouthedera "github.com/meridian-mkt/hedera"
)

type submitProofRequest struct {
	TextUpdate string   `json:"text_update"`
	ImageURLs  []string `json:"image_urls"`
	DocURLs    []string `json:"doc_urls"`
	FileHashes []string `json:"file_hashes"`
}

func (h *Handler) SubmitProof(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims.Role != "organizer" {
		fail(c, http.StatusForbidden, "only organizers can submit proof")
		return
	}

	milestoneID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	// Verify milestone exists, belongs to the caller, and is in a submittable state
	var milestoneStatus string
	var projectID string
	var organizerID string
	err := h.db.QueryRow(context.Background(), `
		SELECT m.status, m.project_id, p.organizer_id::text
		FROM milestones m
		JOIN projects p ON p.id = m.project_id
		WHERE m.id = $1
	`, milestoneID).Scan(&milestoneStatus, &projectID, &organizerID)
	if err != nil {
		fail(c, http.StatusNotFound, "milestone not found")
		return
	}
	if organizerID != claims.UserID.String() {
		fail(c, http.StatusForbidden, "you can only submit proof for your own projects")
		return
	}
	if milestoneStatus != "pending" && milestoneStatus != "rejected" {
		fail(c, http.StatusConflict, "milestone is not in pending/rejected state")
		return
	}

	var req submitProofRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.ImageURLs == nil {
		req.ImageURLs = []string{}
	}
	if req.DocURLs == nil {
		req.DocURLs = []string{}
	}
	if req.FileHashes == nil {
		req.FileHashes = []string{}
	}

	var proof model.ProofSubmission
	err = h.db.QueryRow(context.Background(), `
		INSERT INTO proof_submissions (milestone_id, organizer_id, text_update, image_urls, doc_urls, file_hashes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, milestone_id, organizer_id, COALESCE(text_update,''),
		          image_urls, doc_urls, file_hashes, submitted_at
	`, milestoneID, claims.UserID, req.TextUpdate, req.ImageURLs, req.DocURLs, req.FileHashes).
		Scan(&proof.ID, &proof.MilestoneID, &proof.OrganizerID, &proof.TextUpdate,
			&proof.ImageURLs, &proof.DocURLs, &proof.FileHashes, &proof.SubmittedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to submit proof")
		return
	}

	// Update milestone status to submitted
	_, err = h.db.Exec(context.Background(), `
		UPDATE milestones SET status = 'submitted' WHERE id = $1
	`, milestoneID)
	if err != nil {
		log.Printf("warning: failed to update milestone %s status: %v", milestoneID, err)
	}

	// Async: log to HCS
	go func() {
		var topicID string
		h.db.QueryRow(context.Background(), `
			SELECT COALESCE(hcs_topic_id,'') FROM projects WHERE id = $1
		`, projectID).Scan(&topicID)

		if topicID == "" {
			return
		}
		if err := h.hedera.LogEvent(topicID, sprouthedera.EventProofSubmitted, projectID, map[string]string{
			"milestone_id": milestoneID.String(),
			"proof_id":     proof.ID.String(),
			"organizer_id": claims.UserID.String(),
		}); err != nil {
			log.Printf("hcs: failed to log proof submitted: %v", err)
		}
	}()

	created(c, proof)
}
