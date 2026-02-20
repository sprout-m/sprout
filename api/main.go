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
	"github.com/meridian-marketplace/api/config"
	"github.com/meridian-marketplace/api/db"
	"github.com/meridian-marketplace/api/handler"
	"github.com/meridian-marketplace/api/router"
	"github.com/meridian-marketplace/api/service"
	meridianhedera "github.com/meridian-marketplace/hedera"
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
	hederaCfg := &meridianhedera.Config{
		Network:           cfg.HederaNetwork,
		OperatorAccountID: cfg.HederaOperatorAccount,
		OperatorPrivateKey: cfg.HederaOperatorKey,
		PlatformPublicKey: cfg.HederaPlatformPublicKey,
		USDCTokenID:       cfg.HederaUSDCTokenID,
	}
	hederaSvc, err := service.NewHederaService(hederaCfg)
	if err != nil {
		log.Fatalf("hedera service: %v", err)
	}
	if err := hederaSvc.SetNFTCollection(cfg.HederaNFTCollectionID); err != nil {
		log.Printf("warning: NFT collection not set: %v", err)
	}
	log.Printf("hedera connected (%s)", cfg.HederaNetwork)

	// HTTP server
	h := handler.New(pool, cfg, hederaSvc)
	r := router.New(cfg, h)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("listening on :%s", cfg.Port)
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
