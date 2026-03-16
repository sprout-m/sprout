package router

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/meridian-mkt/api/config"
	"github.com/meridian-mkt/api/handler"
	"github.com/meridian-mkt/api/middleware"
)

func New(cfg *config.Config, h *handler.Handler) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(corsMiddleware())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "app": "sprout", "time": time.Now().UTC()})
	})

	api := r.Group("/api/v1")

	// --- Public ---
	auth := api.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
	}

	// Public project browsing (marketplace)
	api.GET("/projects", h.ListProjects)
	api.GET("/projects/:id", h.GetProject)
	api.GET("/projects/:id/milestones", h.ListMilestones)

	// --- Protected ---
	protected := api.Group("")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	{
		// User profile
		protected.GET("/users/me", h.Me)
		protected.PUT("/users/me", h.UpdateProfile)

		// My projects (organizer) + my investments (funder)
		protected.GET("/users/me/projects", h.ListMyProjects)
		protected.GET("/users/me/investments", h.ListMyInvestments)

		// Project creation (organizer)
		protected.POST("/projects", h.CreateProject)

		// Investment (funder)
		protected.POST("/projects/:id/invest", h.FundProject)

		// Milestones
		protected.GET("/milestones/:id", h.GetMilestone)

		// Proof (organizer)
		protected.POST("/milestones/:id/proof", h.SubmitProof)

		// Approvals (verifier)
		protected.POST("/milestones/:id/approve", h.ApproveMilestone)
		protected.POST("/milestones/:id/reject", h.RejectMilestone)

		// Audit
		protected.GET("/projects/:id/audit", h.GetAuditTimeline)

		// Admin
		admin := protected.Group("/admin")
		{
			admin.GET("/stats", h.AdminStats)
			admin.GET("/users", h.AdminListUsers)
			admin.GET("/projects", h.AdminAllProjects)
		}
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
