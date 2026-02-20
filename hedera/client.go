package hedera

import (
	"fmt"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

func NewClient(cfg *Config) (*hedera.Client, error) {
	var client *hedera.Client

	switch cfg.Network {
	case "mainnet":
		client = hedera.ClientForMainnet()
	case "testnet":
		client = hedera.ClientForTestnet()
	case "local":
		// hedera-local-node defaults: consensus node gRPC on :50211, mirror gRPC on :5600.
		// Start the local node with: npx @hashgraph/hedera-local start
		client = hedera.ClientForTestnet() // base template; overridden below
		nodeAccountID, err := hedera.AccountIDFromString("0.0.3")
		if err != nil {
			return nil, fmt.Errorf("local node account ID: %w", err)
		}
		if err := client.SetNetwork(map[string]hedera.AccountID{
			"127.0.0.1:50211": nodeAccountID,
		}); err != nil {
			return nil, fmt.Errorf("set local network: %w", err)
		}
		client.SetMirrorNetwork([]string{"127.0.0.1:5600"})
	default:
		return nil, fmt.Errorf("unknown network %q: use \"local\", \"testnet\", or \"mainnet\"", cfg.Network)
	}

	operatorAccountID, err := hedera.AccountIDFromString(cfg.OperatorAccountID)
	if err != nil {
		return nil, fmt.Errorf("invalid operator account ID %q: %w", cfg.OperatorAccountID, err)
	}

	operatorPrivateKey, err := hedera.PrivateKeyFromString(cfg.OperatorPrivateKey)
	if err != nil {
		return nil, fmt.Errorf("invalid operator private key: %w", err)
	}

	client.SetOperator(operatorAccountID, operatorPrivateKey)

	return client, nil
}
