import { FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { learners, users } from "@aivo/db";
import { verifyJWT, JWTPayload } from "@aivo/security";

export async function extractAuth(request: FastifyRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      return await verifyJWT(authHeader.slice(7));
    } catch {
      return null;
    }
  }
  const cookieHeader = request.headers.cookie || "";
  const match = cookieHeader.match(/access_token=([^;]+)/);
  if (match) {
    try {
      return await verifyJWT(match[1]);
    } catch {
      return null;
    }
  }
  return null;
}

export async function resolveTenantIdForLearner(
  request: FastifyRequest,
  db: any,
  learnerId?: string | null,
): Promise<string | null> {
  const auth = await extractAuth(request);
  if (auth?.tenantId) return auth.tenantId;

  if (learnerId) {
    try {
      const [row] = await db
        .select({ tenantId: learners.tenantId })
        .from(learners)
        .where(eq(learners.id, learnerId));
      if (row?.tenantId) return row.tenantId;
    } catch {}
  }
  return null;
}

export async function resolveTenantIdForUser(
  request: FastifyRequest,
  db: any,
  userId?: string | null,
  _bodyTenantIdIgnored?: string | null,
): Promise<string | null> {
  const auth = await extractAuth(request);
  if (auth?.tenantId) return auth.tenantId;

  if (userId) {
    try {
      const [row] = await db
        .select({ tenantId: users.tenantId })
        .from(users)
        .where(eq(users.id, userId));
      if (row?.tenantId) return row.tenantId;
    } catch {}
  }
  return null;
}
