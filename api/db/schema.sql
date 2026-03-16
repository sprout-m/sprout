CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT        UNIQUE NOT NULL,
    handle            TEXT        NOT NULL,
    role              TEXT        NOT NULL CHECK (role IN ('funder', 'organizer', 'verifier', 'admin')),
    hedera_account_id TEXT,
    password_hash     TEXT        NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                  TEXT          NOT NULL,
    description           TEXT,
    category              TEXT,
    goal                  TEXT,
    total_amount          NUMERIC(20,2) NOT NULL DEFAULT 0,
    amount_funded         NUMERIC(20,2) NOT NULL DEFAULT 0,
    amount_released       NUMERIC(20,2) NOT NULL DEFAULT 0,
    status                TEXT          NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'completed', 'paused')),
    hcs_topic_id          TEXT,
    hedera_escrow_account TEXT,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    funder_id   UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      NUMERIC(20,2) NOT NULL,
    hedera_tx_id TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT          NOT NULL,
    description TEXT,
    amount      NUMERIC(20,2) NOT NULL DEFAULT 0,
    order_index INT           NOT NULL DEFAULT 0,
    status      TEXT          NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proof_submissions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID        NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    organizer_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text_update  TEXT,
    image_urls   TEXT[]      NOT NULL DEFAULT '{}',
    doc_urls     TEXT[]      NOT NULL DEFAULT '{}',
    file_hashes  TEXT[]      NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approvals (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id     UUID        NOT NULL UNIQUE REFERENCES milestones(id) ON DELETE CASCADE,
    verifier_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision         TEXT        NOT NULL CHECK (decision IN ('approved', 'rejected')),
    note             TEXT,
    approval_payload TEXT,
    kms_key_id       TEXT,
    kms_signature    TEXT,
    hedera_tx_id     TEXT,
    decided_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_organizer  ON projects (organizer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects (status);
CREATE INDEX IF NOT EXISTS idx_investments_project ON investments (project_id);
CREATE INDEX IF NOT EXISTS idx_investments_funder  ON investments (funder_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project  ON milestones (project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status   ON milestones (status);
CREATE INDEX IF NOT EXISTS idx_proofs_milestone    ON proof_submissions (milestone_id);
CREATE INDEX IF NOT EXISTS idx_approvals_milestone ON approvals (milestone_id);
