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
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().UTC()})
	})

	api := r.Group("/api/v1")

	// --- Public ---
	auth := api.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
	}

	// Public listing browse (teaser only, no token required).
	api.GET("/listings", h.ListListings)

	// --- Protected ---
	protected := api.Group("")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	{
		// User profile
		protected.GET("/users/me", h.Me)
		protected.PATCH("/users/me", h.UpdateProfile)
		protected.POST("/users/me/wallet", h.LinkWallet)

		// Seller's own listings (all statuses, no conflict with /:id)
		protected.GET("/seller/listings", h.MyListings)

		// Listings — authenticated users get gated detail access
		protected.GET("/listings/:id", h.GetListing)
		protected.POST("/listings", h.CreateListing)
		protected.PATCH("/listings/:id", h.UpdateListing)

		// Access requests
		protected.POST("/listings/:id/access", h.RequestAccess)
		protected.GET("/listings/:id/access", h.ListAccessRequests) // seller
		protected.GET("/access/mine", h.MyAccessRequests)           // buyer
		protected.PATCH("/access/:id", h.DecideAccess)              // seller

		// Offers
		protected.POST("/listings/:id/offers", h.SubmitOffer)
		protected.GET("/listings/:id/offers", h.ListOffersForListing) // seller
		protected.GET("/offers/mine", h.MyOffers)                     // buyer
		protected.PATCH("/offers/:id/status", h.UpdateOfferStatus)    // seller

		// Escrow & deal closing
		protected.GET("/escrows", h.MyEscrows)
		protected.GET("/escrows/:id", h.GetEscrow)
		protected.POST("/escrows/:id/deposit", h.ConfirmDeposit)    // buyer
		protected.POST("/escrows/:id/release", h.ScheduleRelease)   // operator
		protected.POST("/escrows/:id/dispute", h.OpenDispute)        // buyer or seller
		protected.GET("/escrows/:id/events", h.GetDealEvents)        // audit trail

		// Messages
		protected.GET("/threads", h.ListThreads)
		protected.POST("/threads", h.StartThread)
		protected.GET("/threads/:id", h.GetThread)
		protected.POST("/threads/:id/messages", h.SendMessage)

		// Admin (operator-only, role enforced inside each handler)
		admin := protected.Group("/admin")
		{
			admin.GET("/stats", h.AdminStats)
			admin.GET("/users", h.AdminListUsers)
			admin.GET("/listings", h.AdminAllListings)
			admin.PATCH("/listings/:id/verify", h.AdminVerifyListing)
			admin.GET("/disputes", h.AdminListDisputes)
			admin.POST("/disputes/:id/resolve", h.AdminResolveDispute)
		}
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
