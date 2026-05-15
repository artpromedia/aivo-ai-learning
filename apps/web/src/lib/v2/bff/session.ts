/**
 * Session resolver for the AIVO v2 BFF.
 *
 * The web app's existing auth provider holds a JWT access token in
 * memory and sends it to every API call as
 * `Authorization: Bearer <token>`. The BFF reads that header,
 * verifies the JWT with `@aivo/security`, and returns a typed
 * `BffSession`. There is no second source of session truth — the
 * BFF refuses anything else.
 */
import { verifyJWT, type JWTPayload } from "@aivo/security";
import { BffErrorException, bffError } from "./errors.js";

export type BffRole =
  | "LEARNER"
  | "PARENT"
  | "CAREGIVER"
  | "TEACHER"
  | "THERAPIST"
  | "DISTRICT_ADMIN"
  | "PLATFORM_ADMIN"
  | "SALES"
  | "MARKETING"
  | "CUSTOMER_CARE"
  | "SUPPORT"
  | "FINANCE"
  | "DEVOPS";

export interface BffSession {
  userId: string;
  role: BffRole;
  tenantId: string | null;
  email?: string;
  name?: string;
  /** The verified raw JWT — used by the service client to call upstreams. */
  accessToken: string;
}

const BEARER_PREFIX = /^Bearer\s+/i;

function extractBearer(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const stripped = auth.replace(BEARER_PREFIX, "").trim();
  return stripped.length > 0 ? stripped : null;
}

/**
 * Decode and verify the JWT on the request. Returns `null` if no
 * token is present, throws `BffErrorException(UNAUTHENTICATED)` if a
 * token is present but invalid (the latter is treated as a security
 * event, not as anonymous access).
 */
export async function getOptionalSession(request: Request): Promise<BffSession | null> {
  const token = extractBearer(request);
  if (!token) return null;
  let payload: JWTPayload;
  try {
    payload = await verifyJWT<JWTPayload>(token);
  } catch (err) {
    throw new BffErrorException(
      bffError("UNAUTHENTICATED", {
        message: `Access token failed verification: ${err instanceof Error ? err.message : "unknown"}`,
      }),
    );
  }
  if (!payload.sub || !payload.role) {
    throw new BffErrorException(
      bffError("UNAUTHENTICATED", { message: "Access token is missing required claims" }),
    );
  }
  return {
    userId: payload.sub,
    role: payload.role as BffRole,
    tenantId: payload.tenantId ?? null,
    email: payload.email,
    name: payload.name,
    accessToken: token,
  };
}

export async function getRequiredSession(request: Request): Promise<BffSession> {
  const session = await getOptionalSession(request);
  if (!session) throw new BffErrorException(bffError("UNAUTHENTICATED"));
  return session;
}

export function getCurrentUserRole(session: BffSession): BffRole {
  return session.role;
}

/** Helper used by tests to assemble a session without a real JWT. */
export function buildTestSession(overrides: Partial<BffSession> & { userId: string; role: BffRole }): BffSession {
  return {
    userId: overrides.userId,
    role: overrides.role,
    tenantId: overrides.tenantId ?? "tenant-test",
    email: overrides.email,
    name: overrides.name,
    accessToken: overrides.accessToken ?? "test-token",
  };
}
