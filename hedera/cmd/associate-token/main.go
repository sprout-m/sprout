package main

// One-time setup: associate a USDC (or any HTS) token with a platform account.
//
// Usage:
//   go run ./cmd/associate-token/

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	hedera "github.com/hashgraph/hedera-sdk-go/v2"
)

var reader = bufio.NewReader(os.Stdin)

func prompt(label string) string {
	fmt.Printf("%s: ", label)
	val, _ := reader.ReadString('\n')
	return strings.TrimSpace(val)
}

func main() {
	fmt.Println("── Associate HTS Token Wizard ─────────────────────────────────")
	fmt.Println()

	network := prompt("Network (testnet/mainnet) [testnet]")
	if network == "" {
		network = "testnet"
	}

	operatorID  := prompt("Operator account ID (e.g. 0.0.12345)")
	operatorKey := prompt("Operator private key (DER hex)")
	accountID   := prompt("Account to associate (e.g. 0.0.67890)")
	accountKey  := prompt("That account's private key (DER hex)")
	tokenID     := prompt("Token ID to associate (e.g. 0.0.429274)")

	fmt.Println()

	var client *hedera.Client
	if network == "mainnet" {
		client = hedera.ClientForMainnet()
	} else {
		client = hedera.ClientForTestnet()
	}

	opKey, err := hedera.PrivateKeyFromStringDer(operatorKey)
	if err != nil {
		log.Fatalf("invalid operator key: %v", err)
	}
	opID, err := hedera.AccountIDFromString(operatorID)
	if err != nil {
		log.Fatalf("invalid operator id: %v", err)
	}
	client.SetOperator(opID, opKey)

	accKey, err := hedera.PrivateKeyFromStringDer(accountKey)
	if err != nil {
		log.Fatalf("invalid account key: %v", err)
	}
	accID, err := hedera.AccountIDFromString(accountID)
	if err != nil {
		log.Fatalf("invalid account id: %v", err)
	}
	tok, err := hedera.TokenIDFromString(tokenID)
	if err != nil {
		log.Fatalf("invalid token id: %v", err)
	}

	fmt.Printf("Associating token %s with account %s on %s…\n", tokenID, accountID, network)

	tx, err := hedera.NewTokenAssociateTransaction().
		SetAccountID(accID).
		SetTokenIDs(tok).
		FreezeWith(client)
	if err != nil {
		log.Fatalf("freeze failed: %v", err)
	}

	resp, err := tx.Sign(accKey).Execute(client)
	if err != nil {
		log.Fatalf("execute failed: %v", err)
	}

	rec, err := resp.GetReceipt(client)
	if err != nil {
		log.Fatalf("receipt failed: %v", err)
	}

	fmt.Printf("Done — status: %s\n", rec.Status)
}
