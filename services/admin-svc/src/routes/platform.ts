import { FastifyInstance } from "fastify";
import { users, learners, tenants } from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { sql, eq, count } from "drizzle-orm";

async function requireAdmin(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization header" });
  }
  try {
    const payload = await verifyJWT(auth.slice(7));
    if (!["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(payload.role as string)) {
      return reply.status(403).send({ error: "Admin access required" });
    }
    req.user = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export function registerPlatformRoutes(app: FastifyInstance, db: any) {
  app.get("/api/admin-svc/stats", { preHandler: requireAdmin }, async () => {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [learnerCount] = await db.select({ count: count() }).from(learners);
    const [tenantCount] = await db.select({ count: count() }).from(tenants);
    return {
      users: userCount.count,
      learners: learnerCount.count,
      tenants: tenantCount.count,
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/api/admin-svc/tenants", { preHandler: requireAdmin }, async (request) => {
    const { limit = 50, offset = 0 } = request.query as any;
    const result = await db.select().from(tenants).limit(Number(limit)).offset(Number(offset));
    return { tenants: result, limit: Number(limit), offset: Number(offset) };
  });

  app.get("/api/admin-svc/users", { preHandler: requireAdmin }, async (request) => {
    const { limit = 50, offset = 0 } = request.query as any;
    const result = await db.select({
      id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt,
    }).from(users).limit(Number(limit)).offset(Number(offset));
    return { users: result, limit: Number(limit), offset: Number(offset) };
  });

  app.get("/api/admin-svc/learners", { preHandler: requireAdmin }, async (request) => {
    const { limit = 50, offset = 0 } = request.query as any;
    const result = await db.select().from(learners).limit(Number(limit)).offset(Number(offset));
    return { learners: result, limit: Number(limit), offset: Number(offset) };
  });

  app.get("/api/admin-svc/config", { preHandler: requireAdmin }, async () => {
    return {
      features: {
        coLearning: true,
        homeworkHelper: true,
        sensoryProfiles: true,
        transitionPlanning: true,
        languageProfiles: true,
        dataExport: true,
      },
      limits: {
        maxLearnersPerTenant: 50,
        maxTutorSessionMinutes: 60,
        maxFileUploadMb: 10,
      },
    };
  });

  app.put("/api/admin-svc/config", { preHandler: requireAdmin }, async (request) => {
    const config = request.body as any;
    return { status: "updated", config };
  });
}
