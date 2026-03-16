package hedera

import (
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

	// Credentials are optional — if absent the service runs in stub mode (no on-chain ops).
	return cfg, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
