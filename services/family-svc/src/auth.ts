import { FastifyRequest, FastifyReply } from "fastify";
import { eq, and } from "drizzle-orm";
import { learners } from "@aivo/db";
import { verifyJWT, JWTPayload } from "@aivo/security";

export interface AuthUser {
  sub: string;
  tenantId: string;
  role: string;
  email?: string;
  name?: string;
}

export function extractToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function authenticateRequest(request: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const token = extractToken(request);
  if (!token) {
    reply.code(401).send({ error: "Authentication required" });
    return null;
  }
  try {
    const payload = await verifyJWT(token);
    return payload as AuthUser;
  } catch (_err) {
    reply.code(401).send({ error: "Invalid token" });
    return null;
  }
}

export async function verifyParentOwnership(
  db: ReturnType<typeof import("@aivo/db").createDb>,
  userSub: string,
  learnerId: string
): Promise<boolean> {
  const result = await db.select().from(learners).where(
    and(eq(learners.id, learnerId), eq(learners.parentId, userSub))
  );
  return result.length > 0;
}
