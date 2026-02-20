package config

import (
	"errors"
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string

	// Hedera
	HederaNetwork          string
	HederaOperatorAccount  string
	HederaOperatorKey      string
	HederaPlatformPublicKey string
	HederaUSDCTokenID      string
	HederaNFTCollectionID  string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:                    envOr("APP_PORT", "8080"),
		DatabaseURL:             os.Getenv("DATABASE_URL"),
		JWTSecret:               os.Getenv("JWT_SECRET"),
		HederaNetwork:           envOr("HEDERA_NETWORK", "testnet"),
		HederaOperatorAccount:   os.Getenv("HEDERA_OPERATOR_ACCOUNT_ID"),
		HederaOperatorKey:       os.Getenv("HEDERA_OPERATOR_PRIVATE_KEY"),
		HederaPlatformPublicKey: os.Getenv("HEDERA_PLATFORM_PUBLIC_KEY"),
		HederaUSDCTokenID:       os.Getenv("HEDERA_USDC_TOKEN_ID"),
		HederaNFTCollectionID:   os.Getenv("HEDERA_NFT_COLLECTION_ID"),
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, errors.New("JWT_SECRET is required")
	}
	if cfg.HederaOperatorAccount == "" {
		return nil, errors.New("HEDERA_OPERATOR_ACCOUNT_ID is required")
	}
	if cfg.HederaOperatorKey == "" {
		return nil, errors.New("HEDERA_OPERATOR_PRIVATE_KEY is required")
	}
	if cfg.HederaPlatformPublicKey == "" {
		return nil, errors.New("HEDERA_PLATFORM_PUBLIC_KEY is required")
	}

	return cfg, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
