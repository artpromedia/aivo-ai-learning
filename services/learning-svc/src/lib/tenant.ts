import { FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { learners } from "@aivo/db";
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

export async function resolveTenantId(
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

  const internalTenantHeader = request.headers["x-tenant-id"];
  if (typeof internalTenantHeader === "string" && internalTenantHeader.length > 0) {
    return internalTenantHeader;
  }

  return null;
}
