package handler

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/meridian-mkt/api/middleware"
	"github.com/meridian-mkt/api/model"
)

type fundProjectRequest struct {
	Amount     float64 `json:"amount"      binding:"required,gt=0"`
	HederaTxID string  `json:"hedera_tx_id"`
}

func (h *Handler) FundProject(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if claims.Role != "funder" && claims.Role != "admin" {
		fail(c, http.StatusForbidden, "only funders can invest in projects")
		return
	}

	projectID, ok2 := parseUUID(c, "id")
	if !ok2 {
		return
	}

	var req fundProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, err.Error())
		return
	}

	var status, escrowAccount string
	err := h.db.QueryRow(context.Background(),
		`SELECT status, COALESCE(hedera_escrow_account,'') FROM projects WHERE id = $1`,
		projectID).Scan(&status, &escrowAccount)
	if err != nil {
		fail(c, http.StatusNotFound, "project not found")
		return
	}
	if status != "active" {
		fail(c, http.StatusConflict, "project is not accepting funding")
		return
	}

	var inv model.Investment
	err = h.db.QueryRow(context.Background(), `
		INSERT INTO investments (project_id, funder_id, amount, hedera_tx_id)
		VALUES ($1, $2, $3, NULLIF($4, ''))
		RETURNING id, project_id, funder_id, amount, COALESCE(hedera_tx_id,''), created_at
	`, projectID, claims.UserID, req.Amount, req.HederaTxID).
		Scan(&inv.ID, &inv.ProjectID, &inv.FunderID, &inv.Amount, &inv.HederaTxID, &inv.CreatedAt)
	if err != nil {
		fail(c, http.StatusInternalServerError, "failed to record investment")
		return
	}

	_, _ = h.db.Exec(context.Background(),
		`UPDATE projects SET amount_funded = amount_funded + $1 WHERE id = $2`,
		req.Amount, projectID)

	ok(c, gin.H{
		"investment":     inv,
		"escrow_account": escrowAccount,
	})
}

func (h *Handler) ListMyInvestments(c *gin.Context) {
	claims := middleware.GetClaims(c)

	rows, err := h.db.Query(context.Background(), `
		SELECT i.id, i.project_id, i.funder_id, i.amount,
		       COALESCE(i.hedera_tx_id,''), i.created_at,
		       p.name, p.status, p.category, p.goal
		FROM investments i
		JOIN projects p ON p.id = i.project_id
		WHERE i.funder_id = $1
		ORDER BY i.created_at DESC
	`, claims.UserID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	investments := make([]model.InvestmentWithProject, 0)
	for rows.Next() {
		var inv model.InvestmentWithProject
		if err := rows.Scan(
			&inv.ID, &inv.ProjectID, &inv.FunderID, &inv.Amount,
			&inv.HederaTxID, &inv.CreatedAt,
			&inv.ProjectName, &inv.ProjectStatus, &inv.ProjectCategory, &inv.ProjectGoal,
		); err != nil {
			continue
		}
		investments = append(investments, inv)
	}
	ok(c, investments)
}
