package handler

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
)

type createMilestoneInput struct {
	Title       string  `json:"title"       binding:"required"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"      binding:"required,gt=0"`
	OrderIndex  int     `json:"order_index"`
}

type createProjectRequest struct {
	Name        string                 `json:"name"         binding:"required"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"`
	Goal        string                 `json:"goal"`
	TotalAmount float64                `json:"total_amount" binding:"required,gt=0"`
	Milestones  []createMilestoneInput `json:"milestones"   binding:"required,min=1"`
}

func (h *Handler) CreateProject(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims.Role != "organizer" && claims.Role != "admin" {
		fail(c, http.StatusForbidden, "only organizers can create projects")
		return
	}

	var req createProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	var proj model.Project
	err := h.db.QueryRow(context.Background(), `
		INSERT INTO projects (organizer_id, name, description, category, goal, total_amount)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, organizer_id, name, description, category, goal,
		          total_amount, amount_funded, amount_released, status,
		          COALESCE(hcs_topic_id,''), COALESCE(hedera_escrow_account,''), created_at
	`, claims.UserID, req.Name, req.Description, req.Category, req.Goal, req.TotalAmount).
		Scan(&proj.ID, &proj.OrganizerID,
			&proj.Name, &proj.Description, &proj.Category, &proj.Goal,
			&proj.TotalAmount, &proj.AmountFunded, &proj.AmountReleased, &proj.Status,
			&proj.HCSTopicID, &proj.HederaEscrowAccount, &proj.CreatedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to create project")
		return
	}

	milestones := make([]model.Milestone, 0, len(req.Milestones))
	for i, m := range req.Milestones {
		idx := m.OrderIndex
		if idx == 0 {
			idx = i + 1
		}
		var ms model.Milestone
		err := h.db.QueryRow(context.Background(), `
			INSERT INTO milestones (project_id, title, description, amount, order_index)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, project_id, title, description, amount, order_index, status, created_at
		`, proj.ID, m.Title, m.Description, m.Amount, idx).
			Scan(&ms.ID, &ms.ProjectID, &ms.Title, &ms.Description,
				&ms.Amount, &ms.OrderIndex, &ms.Status, &ms.CreatedAt)
		if err != nil {
			log.Printf("warning: failed to insert milestone %d: %v", i, err)
			continue
		}
		milestones = append(milestones, ms)
	}

	projectIDStr := proj.ID.String()
	go func() {
		result, err := h.hedera.CreateProject(projectIDStr)
		if err != nil {
			log.Printf("hedera: failed to provision project %s: %v", projectIDStr, err)
			return
		}
		_, _ = h.db.Exec(context.Background(), `
			UPDATE projects SET hcs_topic_id = $1, hedera_escrow_account = $2 WHERE id = $3
		`, result.HCSTopicID, result.HederaEscrowAccount, projectIDStr)
		log.Printf("hedera: project %s account=%s topic=%s", projectIDStr, result.HederaEscrowAccount, result.HCSTopicID)
	}()

	created(c, gin.H{"project": proj, "milestones": milestones})
}

func (h *Handler) ListProjects(c *gin.Context) {
	dbRows, err := h.db.Query(context.Background(), `
		SELECT id, organizer_id, name, description, category, goal,
		       total_amount, amount_funded, amount_released, status,
		       COALESCE(hcs_topic_id,''), COALESCE(hedera_escrow_account,''), created_at
		FROM projects WHERE status = 'active'
		ORDER BY created_at DESC
	`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer dbRows.Close()
	ok(c, scanProjects(dbRows))
}

func (h *Handler) ListMyProjects(c *gin.Context) {
	claims := middleware.GetClaims(c)
	dbRows, err := h.db.Query(context.Background(), `
		SELECT id, organizer_id, name, description, category, goal,
		       total_amount, amount_funded, amount_released, status,
		       COALESCE(hcs_topic_id,''), COALESCE(hedera_escrow_account,''), created_at
		FROM projects WHERE organizer_id = $1
		ORDER BY created_at DESC
	`, claims.UserID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer dbRows.Close()
	ok(c, scanProjects(dbRows))
}

func (h *Handler) GetProject(c *gin.Context) {
	id, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var proj model.Project
	err := h.db.QueryRow(context.Background(), `
		SELECT id, organizer_id, name, description, category, goal,
		       total_amount, amount_funded, amount_released, status,
		       COALESCE(hcs_topic_id,''), COALESCE(hedera_escrow_account,''), created_at
		FROM projects WHERE id = $1
	`, id).Scan(
		&proj.ID, &proj.OrganizerID,
		&proj.Name, &proj.Description, &proj.Category, &proj.Goal,
		&proj.TotalAmount, &proj.AmountFunded, &proj.AmountReleased, &proj.Status,
		&proj.HCSTopicID, &proj.HederaEscrowAccount, &proj.CreatedAt,
	)
	if err != nil {
		fail(c, http.StatusNotFound, "project not found")
		return
	}

	msRows, err := h.db.Query(context.Background(), `
		SELECT id, project_id, title, description, amount, order_index, status, created_at
		FROM milestones WHERE project_id = $1 ORDER BY order_index
	`, id)
	if err != nil {
		ok(c, gin.H{"project": proj, "milestones": []model.Milestone{}})
		return
	}
	defer msRows.Close()

	milestones := make([]model.Milestone, 0)
	for msRows.Next() {
		var ms model.Milestone
		if err := msRows.Scan(&ms.ID, &ms.ProjectID, &ms.Title, &ms.Description,
			&ms.Amount, &ms.OrderIndex, &ms.Status, &ms.CreatedAt); err != nil {
			continue
		}
		milestones = append(milestones, ms)
	}
	ok(c, gin.H{"project": proj, "milestones": milestones})
}

func scanProjects(rows interface {
	Next() bool
	Scan(...any) error
	Close()
}) []model.Project {
	projects := make([]model.Project, 0)
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(
			&p.ID, &p.OrganizerID,
			&p.Name, &p.Description, &p.Category, &p.Goal,
			&p.TotalAmount, &p.AmountFunded, &p.AmountReleased, &p.Status,
			&p.HCSTopicID, &p.HederaEscrowAccount, &p.CreatedAt,
		); err != nil {
			continue
		}
		projects = append(projects, p)
	}
	return projects
}
