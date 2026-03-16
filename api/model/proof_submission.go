package model

import (
	"time"

	"github.com/google/uuid"
)

type ProofSubmission struct {
	ID          uuid.UUID `json:"id"`
	MilestoneID uuid.UUID `json:"milestone_id"`
	OrganizerID uuid.UUID `json:"organizer_id"`
	TextUpdate  string    `json:"text_update"`
	ImageURLs   []string  `json:"image_urls"`
	DocURLs     []string  `json:"doc_urls"`
	FileHashes  []string  `json:"file_hashes"`
	SubmittedAt time.Time `json:"submitted_at"`
}
