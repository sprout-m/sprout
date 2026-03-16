package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetAuditTimeline(c *gin.Context) {
	projectID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	// Fetch HCS topic for this project
	var topicID string
	err := h.db.QueryRow(context.Background(), `
		SELECT COALESCE(hcs_topic_id,'') FROM projects WHERE id = $1
	`, projectID).Scan(&topicID)
	if err != nil {
		fail(c, http.StatusNotFound, "project not found")
		return
	}

	if topicID == "" {
		ok(c, gin.H{"events": []interface{}{}, "note": "Hedera topic not yet provisioned"})
		return
	}

	events, err := h.hedera.GetProjectEvents(topicID)
	if err != nil {
		// Return empty on mirror node error (topic may be new)
		ok(c, gin.H{"events": []interface{}{}, "hcs_topic_id": topicID, "error": err.Error()})
		return
	}

	ok(c, gin.H{"events": events, "hcs_topic_id": topicID})
}
