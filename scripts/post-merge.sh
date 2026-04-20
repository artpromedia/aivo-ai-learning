#!/bin/bash
set -e

echo "=== Post-merge setup ==="

echo "Installing pnpm dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "Installing brain-svc Python dependencies..."
cd services/brain-svc && pip install -q -r requirements.txt 2>/dev/null; cd ../..

echo "Pushing database schema..."
pnpm --filter @aivo/db run db:push --force 2>/dev/null || true

echo "Ensuring critical tables exist (idempotent SQL fallback)..."
if [ -n "$DATABASE_URL" ]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=0 <<'SQL' 2>/dev/null || true
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash varchar(128) NOT NULL,
  expires_at timestamp NOT NULL,
  used_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_token_hash_idx ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);

-- Sprint 2: Phishing-resistant MFA
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret_encrypted text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_locked_until timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_failed_attempts integer DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_failed_last_at timestamp;

ALTER TABLE mfa_codes ADD COLUMN IF NOT EXISTS code_hash varchar(64);
UPDATE mfa_codes SET code_hash = encode(sha256(code::bytea), 'hex')
  WHERE code_hash IS NULL AND code IS NOT NULL;
ALTER TABLE mfa_codes ALTER COLUMN code DROP NOT NULL;
DELETE FROM mfa_codes WHERE code_hash IS NULL;
ALTER TABLE mfa_codes ALTER COLUMN code_hash SET NOT NULL;
ALTER TABLE mfa_codes DROP COLUMN IF EXISTS code;

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint DEFAULT 0 NOT NULL,
  transports text,
  label varchar(120) DEFAULT 'Passkey' NOT NULL,
  device_type varchar(32),
  backed_up boolean DEFAULT false,
  created_at timestamp DEFAULT now() NOT NULL,
  last_used_at timestamp
);
CREATE INDEX IF NOT EXISTS webauthn_credentials_user_id_idx ON webauthn_credentials(user_id);

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  code_hash text NOT NULL,
  used_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS mfa_recovery_codes_user_id_idx ON mfa_recovery_codes(user_id);

-- Sprint 4: Audit immutability + impersonation trail
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS seq bigserial;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS on_behalf_of_id uuid;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS prev_hash varchar(64);
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS hash varchar(64);
CREATE INDEX IF NOT EXISTS idx_audit_events_seq ON audit_events(seq);

ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS seq bigserial;
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS on_behalf_of_id uuid REFERENCES users(id);
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS prev_hash varchar(64);
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS hash varchar(64);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_seq ON admin_audit_log(seq);

ALTER TABLE district_activity_log ADD COLUMN IF NOT EXISTS seq bigserial;
ALTER TABLE district_activity_log ADD COLUMN IF NOT EXISTS on_behalf_of_id uuid REFERENCES users(id);
ALTER TABLE district_activity_log ADD COLUMN IF NOT EXISTS prev_hash varchar(64);
ALTER TABLE district_activity_log ADD COLUMN IF NOT EXISTS hash varchar(64);
CREATE INDEX IF NOT EXISTS idx_district_activity_log_seq ON district_activity_log(seq);

CREATE OR REPLACE FUNCTION audit_no_mutate() RETURNS trigger AS $aivo$
BEGIN
  RAISE EXCEPTION 'Audit table % is append-only -- % blocked', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$aivo$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_events_no_mutate ON audit_events;
CREATE TRIGGER audit_events_no_mutate
  BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION audit_no_mutate();
DROP TRIGGER IF EXISTS admin_audit_log_no_mutate ON admin_audit_log;
CREATE TRIGGER admin_audit_log_no_mutate
  BEFORE UPDATE OR DELETE OR TRUNCATE ON admin_audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_no_mutate();
DROP TRIGGER IF EXISTS district_activity_log_no_mutate ON district_activity_log;
CREATE TRIGGER district_activity_log_no_mutate
  BEFORE UPDATE OR DELETE OR TRUNCATE ON district_activity_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_no_mutate();

-- Sprint 5: Admin session hygiene
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  session_id varchar(64) NOT NULL UNIQUE,
  last_activity_at timestamp DEFAULT now() NOT NULL,
  mfa_verified_at timestamp DEFAULT now() NOT NULL,
  device_fingerprint varchar(64) NOT NULL,
  ip_address varchar(45),
  created_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_activity ON admin_sessions(last_activity_at);
SQL
fi

echo "=== Post-merge setup complete ==="
