import { FastifyInstance } from "fastify";
import { verifyJWT } from "@aivo/security";

async function requireAuth(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization header" });
  }
  try {
    req.user = await verifyJWT(auth.slice(7));
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export function registerPlanRoutes(app: FastifyInstance, db: any) {
  app.get("/api/billing/plans", async () => {
    return {
      plans: [
        { id: "free", name: "Free Trial", price: 0, interval: "month", features: ["1 learner", "3 tutors", "Basic brain clone"] },
        { id: "starter", name: "Starter", price: 9.99, interval: "month", features: ["2 learners", "7 core tutors", "Full brain clone", "Parent dashboard"] },
        { id: "family", name: "Family", price: 19.99, interval: "month", features: ["5 learners", "14 tutors", "Full brain clone", "Collaboration", "IEP tracking"] },
        { id: "school", name: "School", price: 49.99, interval: "month", features: ["Unlimited learners", "14 tutors", "Admin dashboard", "Research access", "Priority support"] },
      ],
    };
  });

  app.get("/api/billing/subscription/:tenantId", { preHandler: requireAuth }, async (request, reply) => {
    const { tenantId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return {
      tenantId,
      plan: "free",
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    };
  });

  app.post("/api/billing/subscription", { preHandler: requireAuth }, async (request, reply) => {
    const { tenantId, planId, paymentMethodId } = request.body as any;
    const user = (request as any).user;
    if (!tenantId || !planId) return reply.code(400).send({ error: "tenantId and planId required" });
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return {
      status: "created",
      subscription: { tenantId, planId, status: "active", createdAt: new Date().toISOString() },
    };
  });

  app.post("/api/billing/subscription/:tenantId/cancel", { preHandler: requireAuth }, async (request, reply) => {
    const { tenantId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return { status: "cancelled", tenantId, cancelAtPeriodEnd: true };
  });

  app.get("/api/billing/usage/:tenantId", { preHandler: requireAuth }, async (request, reply) => {
    const { tenantId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return {
      tenantId,
      period: { start: new Date().toISOString(), end: new Date(Date.now() + 30*24*60*60*1000).toISOString() },
      usage: { learners: 1, tutorSessions: 12, aiTokens: 4500, storageBytes: 1024000 },
    };
  });

  app.get("/api/billing/invoices/:tenantId", { preHandler: requireAuth }, async (request, reply) => {
    const { tenantId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return { tenantId, invoices: [] };
  });
}
