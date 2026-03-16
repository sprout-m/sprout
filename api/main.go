package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/meridian-mkt/api/config"
	"github.com/meridian-mkt/api/db"
	"github.com/meridian-mkt/api/handler"
	"github.com/meridian-mkt/api/kms"
	"github.com/meridian-mkt/api/router"
	"github.com/meridian-mkt/api/service"
	sprouthedera "github.com/meridian-mkt/hedera"
)

func main() {
	// Load .env if present (dev convenience; production uses real env vars).
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	// Database
	ctx := context.Background()
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()
	log.Println("database connected and schema applied")

	// Hedera
	hederaCfg := &sprouthedera.Config{
		Network:           cfg.HederaNetwork,
		OperatorAccountID: cfg.HederaOperatorAccount,
		OperatorPrivateKey: cfg.HederaOperatorKey,
	}
	hederaSvc, err := service.NewHederaService(hederaCfg)
	if err != nil {
		log.Fatalf("hedera service: %v", err)
	}
	if cfg.HederaOperatorKey == "" {
		log.Println("warning: Hedera credentials not set — running without on-chain operations")
	} else {
		log.Printf("hedera connected (%s)", cfg.HederaNetwork)
	}

	// AWS KMS (optional — dev mode uses mock signing if not configured)
	var kmsSvc *kms.Service
	if cfg.AWSKMSKeyID != "" {
		kmsSvc, err = kms.New(cfg.AWSRegion, cfg.AWSKMSKeyID)
		if err != nil {
			log.Printf("warning: AWS KMS init failed: %v (approval signing will use mock)", err)
		} else {
			log.Printf("AWS KMS configured: key=%s region=%s", cfg.AWSKMSKeyID, cfg.AWSRegion)
		}
	} else {
		log.Println("AWS_KMS_KEY_ID not set — using mock signing for approvals (dev mode)")
	}

	// HTTP server
	h := handler.New(pool, cfg, hederaSvc, kmsSvc)
	r := router.New(cfg, h)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🌱 Sprout API listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}
	log.Println("bye")
}
