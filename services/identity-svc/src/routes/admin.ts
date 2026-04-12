import { FastifyInstance } from "fastify";
import { users, learners, tenants } from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { eq, sql, desc } from "drizzle-orm";
import argon2 from "argon2";
import crypto from "crypto";

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

async function requirePlatformAdmin(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization header" });
  }
  try {
    const payload = await verifyJWT(auth.slice(7));
    if (payload.role !== "PLATFORM_ADMIN") {
      return reply.status(403).send({ error: "Platform admin access required" });
    }
    req.user = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export async function registerAdminRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.get("/api/admin/stats", {
    preHandler: requireAdmin,
  }, async () => {
    const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    const [learnerCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(learners);
    const [tenantCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(tenants);

    const roleCounts = await db
      .select({ role: users.role, count: sql<number>`COUNT(*)` })
      .from(users)
      .groupBy(users.role);

    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    const recentLearners = await db
      .select({
        id: learners.id,
        name: learners.name,
        functioningLevel: learners.functioningLevel,
        gradeLevel: learners.gradeLevel,
        createdAt: learners.createdAt,
      })
      .from(learners)
      .orderBy(desc(learners.createdAt))
      .limit(10);

    return {
      totalUsers: Number(userCount.count),
      totalLearners: Number(learnerCount.count),
      totalTenants: Number(tenantCount.count),
      roleCounts: roleCounts.map((r: any) => ({ role: r.role, count: Number(r.count) })),
      recentUsers,
      recentLearners,
    };
  });

  app.get("/api/admin/users", {
    preHandler: requireAdmin,
  }, async (req) => {
    const { role, limit: lim } = req.query as { role?: string; limit?: string };
    const maxResults = Math.min(parseInt(lim || "50"), 200);

    let query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt)).limit(maxResults);

    if (role) {
      query = query.where(eq(users.role, role as any));
    }

    return await query;
  });

  app.get("/api/admin/tenants", {
    preHandler: requireAdmin,
  }, async () => {
    const allTenants = await db.select().from(tenants).orderBy(desc(tenants.createdAt)).limit(50);
    return allTenants;
  });

  app.get("/api/admin/learners", {
    preHandler: requireAdmin,
  }, async (req) => {
    const { limit: lim } = req.query as { limit?: string };
    const maxResults = Math.min(parseInt(lim || "50"), 200);

    return await db.select({
      id: learners.id,
      name: learners.name,
      functioningLevel: learners.functioningLevel,
      gradeLevel: learners.gradeLevel,
      curriculumFramework: learners.curriculumFramework,
      createdAt: learners.createdAt,
    }).from(learners).orderBy(desc(learners.createdAt)).limit(maxResults);
  });

  app.post("/api/admin/create-district", {
    preHandler: requirePlatformAdmin,
    schema: {
      tags: ["Admin"],
      body: {
        type: "object",
        required: ["districtName", "adminName", "adminEmail"],
        properties: {
          districtName: { type: "string", minLength: 1 },
          adminName: { type: "string", minLength: 1 },
          adminEmail: { type: "string", format: "email" },
        },
      },
    },
  }, async (req, reply) => {
    const { districtName, adminName, adminEmail } = req.body as any;

    const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ error: "A user with this email already exists" });
    }

    const tempPassword = crypto.randomBytes(6).toString("base64url");

    const [tenant] = await db.insert(tenants).values({
      name: districtName,
      type: "B2B_DISTRICT",
      settings: { plan: "enterprise", setupComplete: false },
    }).returning();

    const [districtAdmin] = await db.insert(users).values({
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash: await argon2.hash(tempPassword),
      name: adminName,
      role: "DISTRICT_ADMIN",
    }).returning();

    return {
      district: {
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        createdAt: tenant.createdAt,
      },
      admin: {
        id: districtAdmin.id,
        name: districtAdmin.name,
        email: districtAdmin.email,
        role: districtAdmin.role,
      },
      temporaryPassword: tempPassword,
    };
  });
}
