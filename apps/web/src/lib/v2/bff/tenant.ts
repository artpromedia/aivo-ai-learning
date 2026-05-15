/**
 * Tenant resolver. The JWT carries the tenant id for the
 * authenticated account; this module exposes the two policy-bearing
 * helpers that v2 routes use to derive a tenant id for a given
 * operation.
 *
 * Two policies matter:
 *   - **For the session itself.** Use the JWT's tenant. Falling back
 *     to a hardcoded "default" tenant is forbidden in production.
 *   - **For a learner.** A parent acting on behalf of a child whose
 *     learner record sits under a different tenant (e.g. a school
 *     tenant) must use the learner's tenant. The resolver fetches
 *     the learner record and returns its tenant id.
 */
import { BffErrorException, bffError } from "./errors.js";
import type { BffSession } from "./session.js";

const DEV_FALLBACK_TENANT = "tenant-dev-local";

/**
 * Resolve a tenant for the session's own operations (settings,
 * notifications, etc.). Returns the JWT tenant if present; falls
 * back to a development tenant only when explicitly enabled.
 */
export function resolveTenantForSession(session: BffSession): string {
  if (session.tenantId) return session.tenantId;
  if (isDevFallbackEnabled()) return DEV_FALLBACK_TENANT;
  throw new BffErrorException(
    bffError("TENANT_NOT_FOUND", {
      message: `Session for user ${session.userId} has no tenantId claim`,
    }),
  );
}

/**
 * Resolve the tenant a learner record lives under. The learner is
 * supplied by callers that already loaded it; the function exists
 * so the policy is in one place and so callers cannot accidentally
 * fall back to the session tenant when they shouldn't.
 */
export function resolveTenantForLearner(
  session: BffSession,
  learner: { id: string; tenantId?: string | null },
): string {
  if (learner.tenantId) return learner.tenantId;
  // If a learner record has no tenant, the session tenant is the
  // only safe fallback — that's the same row a parent's own learner
  // would be inserted into. This is NOT a hardcoded "default"; it is
  // the resolved tenant of the authenticated account.
  if (session.tenantId) return session.tenantId;
  if (isDevFallbackEnabled()) return DEV_FALLBACK_TENANT;
  throw new BffErrorException(
    bffError("TENANT_NOT_FOUND", {
      message: `Learner ${learner.id} has no tenantId and session has no tenantId`,
    }),
  );
}

function isDevFallbackEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.AIVO_BFF_ALLOW_DEV_TENANT === "1";
}

/** Test seam for the dev fallback constant. */
export const __test = { DEV_FALLBACK_TENANT };
