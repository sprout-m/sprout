package hedera

import (
	"errors"
	"os"
)

type Config struct {
	Network string
	OperatorAccountID string
	OperatorPrivateKey string
	PlatformPublicKey string
	USDCTokenID string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		Network:            envOr("HEDERA_NETWORK", "testnet"),
		OperatorAccountID:  os.Getenv("HEDERA_OPERATOR_ACCOUNT_ID"),
		OperatorPrivateKey: os.Getenv("HEDERA_OPERATOR_PRIVATE_KEY"),
		PlatformPublicKey:  os.Getenv("HEDERA_PLATFORM_PUBLIC_KEY"),
		USDCTokenID:        os.Getenv("HEDERA_USDC_TOKEN_ID"),
	}

	if cfg.OperatorAccountID == "" {
		return nil, errors.New("HEDERA_OPERATOR_ACCOUNT_ID is required")
	}
	if cfg.OperatorPrivateKey == "" {
		return nil, errors.New("HEDERA_OPERATOR_PRIVATE_KEY is required")
	}
	if cfg.PlatformPublicKey == "" {
		return nil, errors.New("HEDERA_PLATFORM_PUBLIC_KEY is required")
	}
	if cfg.USDCTokenID == "" {
		return nil, errors.New("HEDERA_USDC_TOKEN_ID is required")
	}

	return cfg, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
