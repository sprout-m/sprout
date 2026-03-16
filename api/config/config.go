package config

import (
	"errors"
	"os"
	"strings"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string

	// Hedera
	HederaNetwork         string
	HederaOperatorAccount string
	HederaOperatorKey     string

	// AWS KMS
	AWSRegion   string
	AWSKMSKeyID string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:                  envOr("APP_PORT", "8080"),
		DatabaseURL:           os.Getenv("DATABASE_URL"),
		JWTSecret:             os.Getenv("JWT_SECRET"),
		HederaNetwork:         envOr("HEDERA_NETWORK", "testnet"),
		HederaOperatorAccount: os.Getenv("HEDERA_OPERATOR_ACCOUNT_ID"),
		HederaOperatorKey:     strings.TrimPrefix(os.Getenv("HEDERA_OPERATOR_PRIVATE_KEY"), "0x"),
		AWSRegion:             envOr("AWS_REGION", "us-east-1"),
		AWSKMSKeyID:           os.Getenv("AWS_KMS_KEY_ID"),
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, errors.New("JWT_SECRET is required")
	}
	// Hedera credentials are optional — app runs in stub mode without them.

	return cfg, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
