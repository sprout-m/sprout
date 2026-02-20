CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT        UNIQUE NOT NULL,
    handle          TEXT        NOT NULL,
    role            TEXT        NOT NULL CHECK (role IN ('buyer', 'seller', 'operator')),
    hedera_account_id TEXT,
    hedera_public_key TEXT,
    password_hash   TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anonymized_name     TEXT        NOT NULL,
    category            TEXT        NOT NULL,
    industry_tags       TEXT[]      NOT NULL DEFAULT '{}',
    location            TEXT,
    asking_range        TEXT,
    revenue_range       TEXT,
    profit_range        TEXT,
    age                 TEXT,
    teaser_description  TEXT,
    status              TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'live', 'under_offer', 'closed')),
    verified            BOOLEAN     NOT NULL DEFAULT FALSE,
    nda_required        BOOLEAN     NOT NULL DEFAULT TRUE,
    escrow_type         TEXT        NOT NULL DEFAULT 'USDC',
    nft_token_id        TEXT,
    nft_serial_number   BIGINT,
    hcs_topic_id        TEXT,
    full_financials     JSONB,
    dataroom_folders    JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_requests (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id              UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nda_signed              BOOLEAN     NOT NULL DEFAULT FALSE,
    proof_of_funds_status   TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (proof_of_funds_status IN ('pending', 'verified', 'failed')),
    proof_amount_usdc       NUMERIC(20,6),
    proof_method            TEXT        CHECK (proof_method IN ('wallet', 'deposit')),
    proof_tx_id             TEXT,
    seller_decision         TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (seller_decision IN ('pending', 'approved', 'denied')),
    access_level            TEXT,
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at              TIMESTAMPTZ,
    UNIQUE (listing_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS offers (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_usdc NUMERIC(20,6) NOT NULL,
    terms       JSONB,
    notes       TEXT,
    status      TEXT        NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escrows (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id            UUID        NOT NULL UNIQUE REFERENCES offers(id) ON DELETE CASCADE,
    hedera_account_id   TEXT,
    hcs_topic_id        TEXT,
    schedule_id         TEXT,
    buyer_deposit_tx    TEXT,
    seller_transfer_tx  TEXT,
    amount_usdc         NUMERIC(20,6) NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'awaitingDeposit'
                            CHECK (status IN (
                                'awaitingDeposit', 'funded', 'releaseScheduled',
                                'completed', 'disputed', 'refunded'
                            )),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_threads (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id   UUID        NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
    sender_type TEXT        NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'system')),
    body        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_seller   ON listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status   ON listings (status);
CREATE INDEX IF NOT EXISTS idx_ar_listing        ON access_requests (listing_id);
CREATE INDEX IF NOT EXISTS idx_ar_buyer          ON access_requests (buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing    ON offers (listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer      ON offers (buyer_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread   ON messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_threads_buyer     ON message_threads (buyer_id);
CREATE INDEX IF NOT EXISTS idx_threads_seller    ON message_threads (seller_id);

-- Additive migrations (idempotent — safe to run on existing databases).
ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS proof_tx_id TEXT;
