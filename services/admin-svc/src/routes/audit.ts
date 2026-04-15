import { FastifyInstance } from "fastify";
import { adminAuditLog } from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { eq, desc, sql, and, gte, lte, or, count, ilike } from "drizzle-orm";

async function requireAdmin(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Missing authorization header" });
  try {
    const payload = await verifyJWT(auth.slice(7));
    if (!["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(payload.role as string))
      return reply.status(403).send({ error: "Admin access required" });
    req.user = payload;
  } catch { return reply.status(401).send({ error: "Invalid token" }); }
}

export async function logAuditEvent(db: any, event: {
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
}) {
  await db.insert(adminAuditLog).values(event);
}

export function registerAuditRoutes(app: FastifyInstance, db: any) {
  app.get("/api/admin-svc/audit-log", { preHandler: requireAdmin }, async (request) => {
    const {
      action, actorId, resourceType, resourceId,
      from, to, page = "1", pageSize = "50", search
    } = request.query as any;

    const pageNum = Math.max(1, Number(page));
    const size = Math.max(1, Math.min(100, Number(pageSize)));
    const offset = (pageNum - 1) * size;

    const conditions: any[] = [];
    if (action) conditions.push(eq(adminAuditLog.action, action));
    if (actorId) conditions.push(eq(adminAuditLog.actorId, actorId));
    if (resourceType) conditions.push(eq(adminAuditLog.resourceType, resourceType));
    if (resourceId) conditions.push(eq(adminAuditLog.resourceId, resourceId));
    if (from) conditions.push(gte(adminAuditLog.createdAt, new Date(from)));
    if (to) conditions.push(lte(adminAuditLog.createdAt, new Date(to)));
    if (search) {
      conditions.push(
        or(
          ilike(adminAuditLog.actorEmail, `%${search}%`),
          sql`${adminAuditLog.details}::text ILIKE ${'%' + search + '%'}`
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db.select({ count: count() }).from(adminAuditLog).where(where);

    const entries = await db.select().from(adminAuditLog)
      .where(where)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(size)
      .offset(offset);

    return { entries, total: totalResult.count, page: pageNum, pageSize: size };
  });

  app.get("/api/admin-svc/activity", { preHandler: requireAdmin }, async () => {
    const entries = await db.select().from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(20);
    return entries;
  });
}
