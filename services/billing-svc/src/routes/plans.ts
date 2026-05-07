import { FastifyInstance } from "fastify";
import { verifyJWT } from "@aivo/security";
import {
  listPlansSchema,
  getSubscriptionSchema,
  createSubscriptionSchema,
  cancelSubscriptionSchema,
  getUsageSchema,
  listAddonsSchema,
  addAddonSchema,
  removeAddonSchema,
  listInvoicesSchema,
} from "./schemas.js";

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
  app.get("/api/billing/plans", { schema: listPlansSchema }, async () => {
    return {
      plans: [
        {
          id: "free",
          name: "Free Trial",
          price: 0,
          interval: "month",
          learnerLimit: 1,
          features: ["1 learner", "ELA tutor only", "Basic brain clone", "Parent dashboard"],
        },
        {
          id: "single",
          name: "Single Learner",
          price: 24.99,
          interval: "month",
          priceLabel: "$24.99/mo per learner",
          learnerLimit: 1,
          features: ["1 learner", "ELA + Math tutors", "2 core tutors included", "Full brain clone", "Parent dashboard", "Add extra tutors at $4.99/mo each"],
        },
        {
          id: "family",
          name: "Family",
          price: 19.99,
          interval: "month",
          priceLabel: "$19.99/mo per learner",
          learnerLimit: 10,
          learnerMinimum: 2,
          features: ["2+ learners", "ELA + Math tutors", "2 core tutors included", "Full brain clone", "Parent dashboard", "Multi-learner discount", "Add extra tutors at $4.99/mo each"],
        },
        {
          id: "district",
          name: "District / School",
          price: 0,
          interval: "month",
          priceLabel: "Contact Sales",
          learnerLimit: -1,
          features: ["Unlimited learners", "All 14 AI tutors", "Full brain clone", "Admin dashboard", "IEP tracking & reporting", "Research access", "Priority support", "Dedicated onboarding"],
        },
      ],
      addons: [
        { id: "extra-tutor", name: "Additional Tutor", price: 4.99, interval: "month", description: "Add any extra AI tutor beyond your plan's included tutors" },
      ],
    };
  });

  app.get("/api/billing/subscription/:tenantId", { schema: getSubscriptionSchema, preHandler: requireAuth }, async (request, reply) => {
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

  app.post("/api/billing/subscription", { schema: createSubscriptionSchema, preHandler: requireAuth }, async (request, reply) => {
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

  app.post("/api/billing/subscription/:tenantId/cancel", { schema: cancelSubscriptionSchema, preHandler: requireAuth }, async (request, reply) => {
    const { tenantId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return { status: "cancelled", tenantId, cancelAtPeriodEnd: true };
  });

  app.get("/api/billing/usage/:tenantId", { schema: getUsageSchema, preHandler: requireAuth }, async (request, reply) => {
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

  app.get("/api/billing/addons/:tenantId", { schema: listAddonsSchema, preHandler: requireAuth }, async (request, reply) => {
    const { tenantId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return { tenantId, addons: [] };
  });

  app.post("/api/billing/addons", { schema: addAddonSchema, preHandler: requireAuth }, async (request, reply) => {
    const { tenantId, tutorId } = request.body as any;
    const user = (request as any).user;
    if (!tenantId || !tutorId) return reply.code(400).send({ error: "tenantId and tutorId required" });
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return {
      status: "created",
      addon: { tenantId, tutorId, price: 4.99, interval: "month", status: "active", createdAt: new Date().toISOString() },
    };
  });

  app.delete("/api/billing/addons/:tenantId/:tutorId", { schema: removeAddonSchema, preHandler: requireAuth }, async (request, reply) => {
    const { tenantId, tutorId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return { status: "removed", tenantId, tutorId };
  });

  app.get("/api/billing/invoices/:tenantId", { schema: listInvoicesSchema, preHandler: requireAuth }, async (request, reply) => {
    const { tenantId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return { tenantId, invoices: [] };
  });
}
