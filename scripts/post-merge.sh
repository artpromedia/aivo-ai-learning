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
SQL
fi

echo "=== Post-merge setup complete ==="
