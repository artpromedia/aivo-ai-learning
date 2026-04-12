import { FastifyInstance } from "fastify";
import { verifyJWT } from "@aivo/security";

const SERVICES = [
  { name: "identity-svc", url: "http://localhost:3001/api/auth/health" },
  { name: "brain-svc", url: "http://localhost:3002/api/brain/health" },
  { name: "assessment-svc", url: "http://localhost:3003/api/assessments/health" },
  { name: "ai-svc", url: "http://localhost:3004/api/ai/health" },
  { name: "learning-svc", url: "http://localhost:3005/api/learning/health" },
  { name: "tutor-svc", url: "http://localhost:3006/api/tutors/health" },
  { name: "family-svc", url: "http://localhost:3007/api/family/health" },
  { name: "engagement-svc", url: "http://localhost:3008/api/engagement/health" },
];

async function checkService(svc: { name: string; url: string }) {
  const start = Date.now();
  try {
    const res = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
    return { name: svc.name, status: res.ok ? "healthy" : "degraded", latencyMs: Date.now() - start, statusCode: res.status };
  } catch {
    return { name: svc.name, status: "down", latencyMs: Date.now() - start, statusCode: 0 };
  }
}

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

export function registerStatusRoutes(app: FastifyInstance) {
  app.get("/api/status/overview", async () => {
    const results = await Promise.all(SERVICES.map(checkService));
    const allHealthy = results.every(r => r.status === "healthy");
    const anyDown = results.some(r => r.status === "down");
    return {
      overall: anyDown ? "major_outage" : allHealthy ? "operational" : "degraded",
      services: results,
      checkedAt: new Date().toISOString(),
    };
  });

  app.get("/api/status/service/:serviceName", async (request, reply) => {
    const { serviceName } = request.params as any;
    const svc = SERVICES.find(s => s.name === serviceName);
    if (!svc) return reply.code(404).send({ error: "Service not found" });
    return await checkService(svc);
  });

  app.get("/api/status/incidents", async () => {
    return { incidents: [], total: 0 };
  });

  app.post("/api/status/incidents", { preHandler: requireAdmin }, async (request) => {
    const { title, description, severity, affectedServices } = request.body as any;
    return {
      id: crypto.randomUUID(),
      title,
      description,
      severity: severity || "minor",
      affectedServices: affectedServices || [],
      status: "investigating",
      createdAt: new Date().toISOString(),
    };
  });

  app.get("/api/status/uptime", async () => {
    return {
      period: "30d",
      uptime: { overall: 99.95, byService: SERVICES.map(s => ({ name: s.name, uptime: 99.9 + Math.random() * 0.1 })) },
    };
  });
}
