package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/meridian-mkt/api/config"
	"github.com/meridian-mkt/api/kms"
	"github.com/meridian-mkt/api/service"
)

// Handler holds shared dependencies injected into all route handlers.
type Handler struct {
	db     *pgxpool.Pool
	cfg    *config.Config
	hedera *service.HederaService
	kms    *kms.Service
}

func New(db *pgxpool.Pool, cfg *config.Config, hedera *service.HederaService, kmsSvc *kms.Service) *Handler {
	return &Handler{db: db, cfg: cfg, hedera: hedera, kms: kmsSvc}
}

func fail(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"error": msg})
}

func ok(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"data": data})
}

func created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"data": data})
}
