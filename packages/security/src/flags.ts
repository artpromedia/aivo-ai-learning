/**
 * Enterprise admin hardening feature flags (Sprint 0).
 *
 * Centralized, typed parsing of ADMIN_ENTERPRISE_* environment variables.
 * All flags default OFF so adding this module is a no-op for existing
 * deployments. Sprints 1-11 will read these flags to gate behaviour.
 *
 * Flags are resolved once per process at import time. Services should call
 * `logAdminEnterpriseFlags(logger)` during bootstrap so operators can see
 * the effective configuration in startup logs.
 */

export interface AdminEnterpriseFlags {
  /** Require WebAuthn / phishing-resistant MFA for admin logins (Sprint 2). */
  STRONG_MFA: boolean;
  /** Require fresh re-auth before high-risk admin actions (Sprint 3). */
  STEP_UP_AUTH: boolean;
  /** Enable SAML SSO + SCIM provisioning for districts (Sprint 6). */
  DISTRICT_SSO: boolean;
  /** Make audit log entries append-only / hash-chained (Sprint 4). */
  AUDIT_IMMUTABLE: boolean;
  /** Idle-timeout (in seconds) for admin sessions; 0 disables (Sprint 5). */
  ADMIN_SESSION_IDLE: number;
}

const PREFIX = "ADMIN_ENTERPRISE_";

export function parseBoolFlag(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined) return defaultValue;
  const v = raw.trim().toLowerCase();
  if (v === "") return defaultValue;
  if (["1", "true", "yes", "on", "enabled"].includes(v)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(v)) return false;
  return defaultValue;
}

export function parseIntFlag(raw: string | undefined, defaultValue: number): number {
  if (raw === undefined) return defaultValue;
  const v = raw.trim();
  if (v === "") return defaultValue;
  if (!/^\d+$/.test(v)) return defaultValue;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return defaultValue;
  return n;
}

export function loadAdminEnterpriseFlags(
  env: NodeJS.ProcessEnv = process.env,
): AdminEnterpriseFlags {
  return {
    STRONG_MFA: parseBoolFlag(env[`${PREFIX}STRONG_MFA`], false),
    STEP_UP_AUTH: parseBoolFlag(env[`${PREFIX}STEP_UP_AUTH`], false),
    DISTRICT_SSO: parseBoolFlag(env[`${PREFIX}DISTRICT_SSO`], false),
    AUDIT_IMMUTABLE: parseBoolFlag(env[`${PREFIX}AUDIT_IMMUTABLE`], false),
    ADMIN_SESSION_IDLE: parseIntFlag(env[`${PREFIX}ADMIN_SESSION_IDLE`], 0),
  };
}

export const ADMIN_ENTERPRISE: AdminEnterpriseFlags = loadAdminEnterpriseFlags();

interface BootstrapLogger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
}

/**
 * Emit a single structured log line summarizing the resolved flag values.
 * Call once during service bootstrap.
 */
export function logAdminEnterpriseFlags(
  logger: BootstrapLogger,
  flags: AdminEnterpriseFlags = ADMIN_ENTERPRISE,
): void {
  logger.info({ adminEnterpriseFlags: flags }, "admin enterprise feature flags");
}
