.PHONY: up down db-reset setup run build

# ── Infrastructure ────────────────────────────────────────────────────────────

## Start PostgreSQL in Docker
up:
	docker compose up -d postgres
	@echo "Waiting for postgres..." && sleep 2

## Stop and remove all containers
down:
	docker compose down

## Drop and recreate the meridian database (wipes all data)
db-reset:
	docker compose exec postgres psql -U meridian -c "DROP DATABASE IF EXISTS meridian;"
	docker compose exec postgres psql -U meridian -c "CREATE DATABASE meridian;"
	@echo "Database reset. Run 'make run' to re-apply schema."

# ── Application ───────────────────────────────────────────────────────────────

## One-time setup: deploy test USDC + NFT collection, create + seed test accounts.
## Copy the printed token IDs into your .env before running 'make run'.
setup:
	go run ./cmd/setup

## Run the API server (loads .env automatically)
run:
	go run .

## Build a production binary
build:
	go build -o bin/api .
