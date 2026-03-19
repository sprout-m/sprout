<p align="center">
  <img src="web/public/sproutwithwhitetext.png" alt="Sprout" width="420"/>
</p>

<p align="center">
  A milestone-based escrow platform for sustainability projects — release funding only when progress is independently verified.
</p>

---

## Overview

Sprout is a trust-minimised funding platform built for the **Hedera Apex Hackathon 2026 — Sustainability Track**.

1. **Organizers** create sustainability projects with defined milestones and funding targets
2. **Funders** browse the public marketplace and lock capital into project escrow accounts on Hedera
3. **Organizers** submit proof of progress (text, images, documents) for each milestone
4. **Verifiers** review the proof and approve — triggering an AWS KMS cryptographic signature
5. **Hedera** transfers HBAR to the organizer on-chain; every event is written to an immutable HCS audit topic

---

## Architecture

```
meridian/
├── api/          # Go REST API (Gin, PostgreSQL, Hedera SDK, AWS KMS)
│   ├── config/       # Environment-based configuration
│   ├── db/           # Schema auto-migration on startup
│   ├── handler/      # HTTP route handlers
│   ├── kms/          # AWS KMS signing package
│   ├── middleware/   # JWT auth
│   ├── model/        # Domain types
│   ├── router/       # Route registration
│   └── service/      # Hedera service wrapper
├── hedera/       # Hedera SDK package (escrow accounts, HCS)
└── web/          # React frontend (Vite, React Router)
```

### Tech stack

| Layer | Technology |
|---|---|
| API | Go 1.22+, Gin, pgx v5 |
| Database | PostgreSQL 14+ |
| Signing | AWS KMS (ECDSA_SHA_256) |
| Blockchain | Hedera Hashgraph (HCS audit trail, HBAR escrow) |
| Frontend | React 18, Vite, React Router v6 |
| Auth | JWT (HS256) |

### Hedera components

| Component | Purpose |
|---|---|
| **Escrow account** | Per-project Hedera account holding HBAR; operator key controlled |
| **HCS topic** | Immutable per-project audit trail (`PROJECT_CREATED` → `FUNDS_RELEASED`) |
| **HBAR transfer** | Released to organizer on-chain after KMS-signed approval |

### AWS KMS

Every milestone approval is signed by AWS KMS — the private key never leaves the HSM. The signature is stored alongside the approval and can be verified by anyone with the public key. AWS CloudTrail provides automatic audit logging of every KMS operation.

---

## Roles

| Role | Capabilities |
|---|---|
| `organizer` | Create projects, define milestones, submit proof of progress |
| `funder` | Browse marketplace, invest capital in projects |
| `verifier` | Review submitted proof, approve or reject milestone releases |
| `admin` | View all projects and system stats |

---

## Prerequisites

- **Go** 1.22+
- **Node.js** 20+ and npm
- **PostgreSQL** 14+ (system service or Docker)
- A **Hedera testnet** operator account — create one free at [portal.hedera.com](https://portal.hedera.com) *(optional for dev; app starts without it)*
- **AWS credentials** with KMS access *(optional for dev; mock signing used when absent)*

---

## Setup

### 1. Clone and enter the repo

```bash
git clone <repo-url>
cd meridian
```

### 2. Configure the API

```bash
cp api/.env.example api/.env
```

Edit `api/.env`:

```env
# Required
DATABASE_URL=postgres://sprout:sprout@localhost:5432/sprout?sslmode=disable
JWT_SECRET=change-me-in-production

# Optional — app starts without these (Hedera/KMS features disabled)
HEDERA_OPERATOR_ACCOUNT_ID=0.0.XXXXX
HEDERA_OPERATOR_PRIVATE_KEY=302e...
AWS_REGION=us-east-1
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### 3. Start PostgreSQL

**System PostgreSQL (Linux/macOS):**
```bash
# Create database and user
psql -U postgres -c "CREATE USER sprout WITH PASSWORD 'sprout';"
psql -U postgres -c "CREATE DATABASE sprout OWNER sprout;"
```

**Docker:**
```bash
cd api && make up
```

### 4. Start the API

```bash
cd api
make run
# API listening on :8080
# Schema applied automatically on first start
```

### 5. Start the frontend

```bash
cd web
npm install
npm run dev
# Frontend at http://localhost:5173
```

---

## Demo flow

1. Register three accounts: one as **organizer**, one as **funder**, one as **verifier**
2. As organizer: create a project ("Community Solar Farm") with 3 milestones
3. Verify a Hedera HCS topic was created and `PROJECT_CREATED` event logged
4. As funder: browse the marketplace, click "Fund Project", enter an amount
5. As organizer: submit proof for milestone 1 (text update + image URL)
6. Verify `PROOF_SUBMITTED` HCS event
7. As verifier: open the review queue, approve the milestone
8. Verify AWS KMS signature stored + `MILESTONE_APPROVED` and `FUNDS_RELEASED` HCS events
9. Check project page shows updated amount released and audit timeline

---

## API environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `HEDERA_OPERATOR_ACCOUNT_ID` | No | — | Platform Hedera account (e.g. `0.0.12345`) |
| `HEDERA_OPERATOR_PRIVATE_KEY` | No | — | Platform Ed25519 private key (DER hex or raw hex) |
| `HEDERA_NETWORK` | No | `testnet` | `testnet` or `mainnet` |
| `AWS_REGION` | No | — | AWS region for KMS (e.g. `us-east-1`) |
| `AWS_KMS_KEY_ID` | No | — | KMS key ARN or alias |
| `AWS_ACCESS_KEY_ID` | No | — | AWS access key (or use IAM role) |
| `AWS_SECRET_ACCESS_KEY` | No | — | AWS secret key (or use IAM role) |
| `APP_PORT` | No | `8080` | HTTP listen port |

---

## Makefile reference (api/)

```bash
make up        # Start PostgreSQL in Docker
make down      # Stop and remove containers
make db-reset  # Wipe and recreate the database
make run       # Start the API server
make build     # Compile to bin/api
```

---

## Production build

**API:**
```bash
cd api
make build
./bin/api
```

**Frontend:**
```bash
cd web
npm run build
# Output in web/dist/ — serve with any static file host
```

---

## Hackathon tracks

- **Main track:** Sustainability — milestone-based proof of impact for environmental and social projects
- **AWS bounty:** AWS KMS signs every approval; private key never exposed; CloudTrail provides automatic audit logging
- **Hedera bounty:** HCS consensus timestamps on all events; HBAR transferred on-chain at fund release
