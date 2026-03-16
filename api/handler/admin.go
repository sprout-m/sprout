package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/meridian-mkt/api/middleware"
)

func adminOnly(c *gin.Context) bool {
	claims := middleware.GetClaims(c)
	if claims == nil || claims.Role != "admin" {
		fail(c, http.StatusForbidden, "admin only")
		return false
	}
	return true
}

// ── Stats ─────────────────────────────────────────────────────────────────────

type platformStats struct {
	TotalUsers      int `json:"total_users"`
	TotalFunders    int `json:"total_funders"`
	TotalOrganizers int `json:"total_organizers"`
	TotalVerifiers  int `json:"total_verifiers"`
	ProjectsActive  int `json:"projects_active"`
	ProjectsDone    int `json:"projects_completed"`
	MilestonesTotal int `json:"milestones_total"`
	MilestonesApproved int `json:"milestones_approved"`
	MilestonesPending  int `json:"milestones_pending"`
}

func (h *Handler) AdminStats(c *gin.Context) {
	if !adminOnly(c) {
		return
	}

	var s platformStats

	h.db.QueryRow(context.Background(), `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE role = 'funder'),
			COUNT(*) FILTER (WHERE role = 'organizer'),
			COUNT(*) FILTER (WHERE role = 'verifier')
		FROM users
	`).Scan(&s.TotalUsers, &s.TotalFunders, &s.TotalOrganizers, &s.TotalVerifiers)

	h.db.QueryRow(context.Background(), `
		SELECT
			COUNT(*) FILTER (WHERE status = 'active'),
			COUNT(*) FILTER (WHERE status = 'completed')
		FROM projects
	`).Scan(&s.ProjectsActive, &s.ProjectsDone)

	h.db.QueryRow(context.Background(), `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'approved'),
			COUNT(*) FILTER (WHERE status = 'pending')
		FROM milestones
	`).Scan(&s.MilestonesTotal, &s.MilestonesApproved, &s.MilestonesPending)

	ok(c, s)
}

// ── Users ─────────────────────────────────────────────────────────────────────

type adminUserRow struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Handle    string    `json:"handle"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *Handler) AdminListUsers(c *gin.Context) {
	if !adminOnly(c) {
		return
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT id, email, handle, role, created_at
		FROM users
		ORDER BY created_at DESC
	`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	users := make([]adminUserRow, 0)
	for rows.Next() {
		var u adminUserRow
		if err := rows.Scan(&u.ID, &u.Email, &u.Handle, &u.Role, &u.CreatedAt); err != nil {
			continue
		}
		users = append(users, u)
	}

	ok(c, users)
}

// ── Projects ──────────────────────────────────────────────────────────────────

type adminProjectRow struct {
	ID             uuid.UUID  `json:"id"`
	Name           string     `json:"name"`
	Category       string     `json:"category"`
	Status         string     `json:"status"`
	TotalAmount    float64    `json:"total_amount"`
	AmountReleased float64    `json:"amount_released"`
	FunderHandle   string     `json:"funder_handle"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (h *Handler) AdminAllProjects(c *gin.Context) {
	if !adminOnly(c) {
		return
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT p.id, p.name, p.category, p.status, p.total_amount, p.amount_released,
		       u.handle, p.created_at
		FROM projects p
		JOIN users u ON u.id = p.funder_id
		ORDER BY p.created_at DESC
	`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	projects := make([]adminProjectRow, 0)
	for rows.Next() {
		var p adminProjectRow
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Category, &p.Status,
			&p.TotalAmount, &p.AmountReleased,
			&p.FunderHandle, &p.CreatedAt,
		); err != nil {
			continue
		}
		projects = append(projects, p)
	}

	ok(c, projects)
}
