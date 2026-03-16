.PHONY: up down db-reset deps run build

# ── Infrastructure ────────────────────────────────────────────────────────────

## Start PostgreSQL in Docker
up:
	docker compose up -d postgres
	@echo "Waiting for postgres..." && sleep 2

## Stop and remove all containers
down:
	docker compose down

## Drop and recreate the sprout database (wipes all data)
db-reset:
	docker compose exec postgres psql -U sprout -c "DROP DATABASE IF EXISTS sprout;"
	docker compose exec postgres psql -U sprout -c "CREATE DATABASE sprout;"
	@echo "Database reset. Run 'make run' to re-apply schema."

# ── Application ───────────────────────────────────────────────────────────────

## Fetch all Go dependencies (including AWS SDK)
deps:
	go get github.com/aws/aws-sdk-go-v2
	go get github.com/aws/aws-sdk-go-v2/config
	go get github.com/aws/aws-sdk-go-v2/service/kms
	go mod tidy

## Run the API server (loads .env automatically)
run:
	go run .

## Build a production binary
build:
	go build -o bin/api .
