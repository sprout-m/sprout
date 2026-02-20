package main

import (
	"fmt"
	"log"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

func main() {
	privateKey, err := hedera.PrivateKeyGenerateEd25519()
	if err != nil {
		log.Fatalf("failed to generate private key: %v", err)
	}

	publicKey := privateKey.PublicKey()

	fmt.Println("Private key :", privateKey.StringDer())
	fmt.Println("Public key  :", publicKey.StringDer())
	fmt.Println()
	fmt.Println("Create the account:")
	fmt.Println("  1. Go to https://portal.hedera.com")
	fmt.Println("  2. Create a new testnet account using the public key above.")
	fmt.Println("  OR use the Hedera Testnet Faucet to fund a new account.")
}
