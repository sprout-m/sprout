// cmd/setup seeds the Sprout database with test accounts for local development.
//
// It creates three users (password: Test1234!):
//   - funder@sprout.test   (funder role)
//   - organizer@sprout.test (organizer role)
//   - verifier@sprout.test  (verifier role)
//   - admin@sprout.test     (admin role)
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

const testPassword = "Test1234!"

func main() {
	_ = godotenv.Load()

	databaseURL := mustEnv("DATABASE_URL")

	fmt.Println("Sprout setup — seeding test accounts...")

	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(testPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("bcrypt: %v", err)
	}

	testUsers := []struct {
		email  string
		handle string
		role   string
	}{
		{"funder@sprout.test", "alice", "funder"},
		{"organizer@sprout.test", "bob", "organizer"},
		{"verifier@sprout.test", "carol", "verifier"},
		{"admin@sprout.test", "admin", "admin"},
	}

	for _, u := range testUsers {
		_, err := pool.Exec(context.Background(), `
			INSERT INTO users (email, handle, role, password_hash)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (email) DO NOTHING
		`, u.email, u.handle, u.role, string(passwordHash))
		if err != nil {
			log.Printf("  warning: seed %s: %v", u.email, err)
		} else {
			fmt.Printf("  ✓ %s (%s)\n", u.email, u.role)
		}
	}

	fmt.Println()
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("  Setup complete. Test accounts (password: Test1234!):")
	fmt.Println()
	for _, u := range testUsers {
		fmt.Printf("  %s  →  %s role\n", u.email, u.role)
	}
	fmt.Println()
	fmt.Println("  Run: make run")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var %s is not set — copy .env.example to .env first", key)
	}
	return v
}
