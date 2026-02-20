// cmd/setup is a one-time initialisation script for local / testnet development.
//
// It:
//   1. Creates a test USDC HTS token (HEDERA_USDC_TOKEN_ID not set)
//   2. Creates the listing NFT collection  (HEDERA_NFT_COLLECTION_ID not set)
//   3. Generates buyer + seller Hedera key pairs, creates their on-chain accounts
//   4. Associates USDC with the buyer account and funds it with 500 000 test USDC
//   5. Seeds the PostgreSQL database with the three test users
//
// At the end it prints the token IDs and test credentials so you can paste them
// into your .env before starting the API server.
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	sdk "github.com/hashgraph/hedera-sdk-go/v2"
	meridianhedera "github.com/meridian-mkt/hedera"
)

const (
	testPassword    = "Test1234!"
	buyerUSDCAmount = 500_000.0
	mintUSDCAmount  = 1_000_000.0
	initialHbar     = 100
)

func main() {
	_ = godotenv.Load()

	network := envOr("HEDERA_NETWORK", "local")
	operatorAccountID := mustEnv("HEDERA_OPERATOR_ACCOUNT_ID")
	operatorPrivateKey := mustEnv("HEDERA_OPERATOR_PRIVATE_KEY")
	platformPublicKey := mustEnv("HEDERA_PLATFORM_PUBLIC_KEY")
	usdcTokenIDStr := os.Getenv("HEDERA_USDC_TOKEN_ID")
	nftCollectionIDStr := os.Getenv("HEDERA_NFT_COLLECTION_ID")
	databaseURL := mustEnv("DATABASE_URL")

	fmt.Printf("Meridian setup — network: %s\n\n", network)

	// Build a minimal hedera config. USDCTokenID is a placeholder here because
	// NewClient() doesn't use it — only NewHederaService() does.
	hederaCfg := &meridianhedera.Config{
		Network:           network,
		OperatorAccountID: operatorAccountID,
		OperatorPrivateKey: operatorPrivateKey,
		PlatformPublicKey: platformPublicKey,
		USDCTokenID:       "0.0.1", // placeholder
	}

	client, err := meridianhedera.NewClient(hederaCfg)
	if err != nil {
		log.Fatalf("hedera client: %v", err)
	}

	// ── 1. Test USDC ──────────────────────────────────────────────────────────

	var usdcTokenID sdk.TokenID

	if usdcTokenIDStr == "" {
		fmt.Print("Creating test USDC stablecoin... ")
		usdcTokenID, err = meridianhedera.CreateTestStablecoin(client)
		if err != nil {
			log.Fatalf("\n  error: %v", err)
		}
		usdcTokenIDStr = usdcTokenID.String()
		fmt.Printf("OK (%s)\n", usdcTokenIDStr)
	} else {
		usdcTokenID, err = sdk.TokenIDFromString(usdcTokenIDStr)
		if err != nil {
			log.Fatalf("parse USDC token ID: %v", err)
		}
		fmt.Printf("Using existing USDC token: %s\n", usdcTokenIDStr)
	}

	// ── 2. NFT collection ─────────────────────────────────────────────────────

	if nftCollectionIDStr == "" {
		fmt.Print("Creating listing NFT collection... ")
		nftID, err := meridianhedera.CreateListingNFTCollection(client)
		if err != nil {
			log.Fatalf("\n  error: %v", err)
		}
		nftCollectionIDStr = nftID.String()
		fmt.Printf("OK (%s)\n", nftCollectionIDStr)
	} else {
		fmt.Printf("Using existing NFT collection: %s\n", nftCollectionIDStr)
	}

	// ── 3. Buyer account ──────────────────────────────────────────────────────

	fmt.Print("Creating buyer Hedera account... ")
	buyerPrivKey, err := sdk.GeneratePrivateKey()
	if err != nil {
		log.Fatalf("generate buyer key: %v", err)
	}
	buyerAccountID, err := createAccount(client, buyerPrivKey.PublicKey())
	if err != nil {
		log.Fatalf("\n  error: %v", err)
	}
	fmt.Printf("OK (%s)\n", buyerAccountID)

	// ── 4. Associate USDC with buyer and fund them ────────────────────────────

	fmt.Print("Associating USDC with buyer... ")
	if err := associateToken(client, buyerAccountID, usdcTokenID, buyerPrivKey); err != nil {
		log.Fatalf("\n  error: %v", err)
	}
	fmt.Println("OK")

	fmt.Printf("Minting %s test USDC to operator treasury... ", formatUSDC(mintUSDCAmount))
	if err := meridianhedera.MintTestUSDC(client, usdcTokenID, mintUSDCAmount); err != nil {
		log.Fatalf("\n  error: %v", err)
	}
	fmt.Println("OK")

	fmt.Printf("Transferring %s test USDC to buyer... ", formatUSDC(buyerUSDCAmount))
	if err := meridianhedera.TransferTestUSDC(client, usdcTokenID, buyerAccountID, buyerUSDCAmount); err != nil {
		log.Fatalf("\n  error: %v", err)
	}
	fmt.Println("OK")

	// ── 5. Seller account ─────────────────────────────────────────────────────

	fmt.Print("Creating seller Hedera account... ")
	sellerPrivKey, err := sdk.GeneratePrivateKey()
	if err != nil {
		log.Fatalf("generate seller key: %v", err)
	}
	sellerAccountID, err := createAccount(client, sellerPrivKey.PublicKey())
	if err != nil {
		log.Fatalf("\n  error: %v", err)
	}
	fmt.Printf("OK (%s)\n", sellerAccountID)

	// ── 6. Seed database ──────────────────────────────────────────────────────

	fmt.Print("Connecting to database... ")
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("\n  error: %v", err)
	}
	defer pool.Close()
	fmt.Println("OK")

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(testPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("bcrypt: %v", err)
	}

	seedUser(pool, "buyer@meridian.test", "alice", "buyer",
		buyerAccountID.String(), buyerPrivKey.PublicKey().String(), string(passwordHash))

	seedUser(pool, "seller@meridian.test", "bob", "seller",
		sellerAccountID.String(), sellerPrivKey.PublicKey().String(), string(passwordHash))

	seedUser(pool, "operator@meridian.test", "admin", "operator",
		"", "", string(passwordHash))

	// ── 7. Summary ────────────────────────────────────────────────────────────

	fmt.Println()
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("  Setup complete.")
	fmt.Println()
	fmt.Println("  Add these to your .env:")
	fmt.Println()
	fmt.Printf("  HEDERA_USDC_TOKEN_ID=%s\n", usdcTokenIDStr)
	fmt.Printf("  HEDERA_NFT_COLLECTION_ID=%s\n", nftCollectionIDStr)
	fmt.Println()
	fmt.Println("  Test accounts (password: Test1234!):")
	fmt.Println()
	fmt.Printf("  buyer@meridian.test\n")
	fmt.Printf("    Hedera account:  %s\n", buyerAccountID)
	fmt.Printf("    Private key:     %s\n", buyerPrivKey.String())
	fmt.Printf("    USDC balance:    %s\n", formatUSDC(buyerUSDCAmount))
	fmt.Println()
	fmt.Printf("  seller@meridian.test\n")
	fmt.Printf("    Hedera account:  %s\n", sellerAccountID)
	fmt.Printf("    Private key:     %s\n", sellerPrivKey.String())
	fmt.Println()
	fmt.Println("  operator@meridian.test  (no Hedera account)")
	fmt.Println()
	fmt.Println("  Then run: make run")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

// createAccount generates a new Hedera account funded with initialHbar HBAR.
// The operator pays the account creation fee.
func createAccount(client *sdk.Client, pubKey sdk.PublicKey) (sdk.AccountID, error) {
	txResponse, err := sdk.NewAccountCreateTransaction().
		SetKey(pubKey).
		SetInitialBalance(sdk.NewHbar(initialHbar)).
		// Allow the account to auto-associate with one HTS token (USDC).
		SetMaxAutomaticTokenAssociations(1).
		Execute(client)
	if err != nil {
		return sdk.AccountID{}, fmt.Errorf("execute: %w", err)
	}

	receipt, err := txResponse.GetReceipt(client)
	if err != nil {
		return sdk.AccountID{}, fmt.Errorf("receipt: %w", err)
	}

	return *receipt.AccountID, nil
}

// associateToken explicitly associates an HTS token with an account.
// The transaction must be signed by the account's own key.
func associateToken(client *sdk.Client, accountID sdk.AccountID, tokenID sdk.TokenID, key sdk.PrivateKey) error {
	frozenTx, err := sdk.NewTokenAssociateTransaction().
		SetAccountID(accountID).
		SetTokenIDs(tokenID).
		FreezeWith(client)
	if err != nil {
		return fmt.Errorf("freeze: %w", err)
	}

	resp, err := frozenTx.Sign(key).Execute(client)
	if err != nil {
		return fmt.Errorf("execute: %w", err)
	}

	_, err = resp.GetReceipt(client)
	return err
}

// seedUser upserts a test user into the database.
func seedUser(pool *pgxpool.Pool, email, handle, role, hederaAccountID, hederaPublicKey, passwordHash string) {
	_, err := pool.Exec(context.Background(), `
		INSERT INTO users (email, handle, role, hedera_account_id, hedera_public_key, password_hash)
		VALUES ($1, $2, $3, NULLIF($4,''), NULLIF($5,''), $6)
		ON CONFLICT (email) DO UPDATE SET
			hedera_account_id = EXCLUDED.hedera_account_id,
			hedera_public_key = EXCLUDED.hedera_public_key,
			updated_at        = NOW()
	`, email, handle, role, hederaAccountID, hederaPublicKey, passwordHash)
	if err != nil {
		log.Printf("  warning: seed %s: %v", email, err)
	} else {
		fmt.Printf("  Seeded %s (%s)\n", email, role)
	}
}

func formatUSDC(amount float64) string {
	return fmt.Sprintf("%.0f USDC", amount)
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var %s is not set — copy .env.local.example to .env first", key)
	}
	return v
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
