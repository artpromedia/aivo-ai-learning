-- Sprint 2: Phishing-resistant MFA (TOTP + WebAuthn passkeys + recovery codes,
-- email OTP hashed at rest). Idempotent — safe to re-run.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret_encrypted" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_failed_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint

ALTER TABLE "mfa_codes" ADD COLUMN IF NOT EXISTS "code_hash" varchar(64);--> statement-breakpoint
UPDATE "mfa_codes" SET "code_hash" = encode(sha256("code"::bytea), 'hex') WHERE "code_hash" IS NULL AND "code" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "mfa_codes" ALTER COLUMN "code" DROP NOT NULL;--> statement-breakpoint
DELETE FROM "mfa_codes" WHERE "code_hash" IS NULL;--> statement-breakpoint
ALTER TABLE "mfa_codes" ALTER COLUMN "code_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mfa_codes" DROP COLUMN IF EXISTS "code";--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "credential_id" text NOT NULL,
  "public_key" text NOT NULL,
  "counter" bigint DEFAULT 0 NOT NULL,
  "transports" text,
  "label" varchar(120) DEFAULT 'Passkey' NOT NULL,
  "device_type" varchar(32),
  "backed_up" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "last_used_at" timestamp,
  CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webauthn_credentials_user_id_idx" ON "webauthn_credentials"("user_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mfa_recovery_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "code_hash" text NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mfa_recovery_codes" ADD CONSTRAINT "mfa_recovery_codes_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mfa_recovery_codes_user_id_idx" ON "mfa_recovery_codes"("user_id");
