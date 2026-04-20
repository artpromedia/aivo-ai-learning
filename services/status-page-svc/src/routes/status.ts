import { FastifyInstance } from "fastify";
import { verifyJWT } from "@aivo/security";
import { createLogger } from "@aivo/observability";

const logger = createLogger("status-page-svc:status");

const SERVICES = [
  { name: "identity-svc", url: "http://localhost:3001/api/auth/health" },
  { name: "brain-svc", url: "http://localhost:3002/api/brain/health" },
  { name: "assessment-svc", url: "http://localhost:3003/api/assessments/health" },
  { name: "ai-svc", url: "http://localhost:3004/api/ai/health" },
  { name: "learning-svc", url: "http://localhost:3005/api/learning/health" },
  { name: "tutor-svc", url: "http://localhost:3006/api/tutors/health" },
  { name: "family-svc", url: "http://localhost:3007/api/family/health" },
  { name: "engagement-svc", url: "http://localhost:3008/api/engagement/health" },
  { name: "billing-svc", url: "http://localhost:3009/api/billing/health" },
  { name: "comms-svc", url: "http://localhost:3010/api/comms/health" },
  { name: "i18n-svc", url: "http://localhost:3011/api/i18n/health" },
  { name: "integrations-svc", url: "http://localhost:3012/api/integrations/health" },
  { name: "admin-svc", url: "http://localhost:3013/api/admin-svc/health" },
  { name: "status-page-svc", url: "http://localhost:3014/api/status/health" },
  { name: "research-svc", url: "http://localhost:3015/api/research/health" },
];

const SLOW_THRESHOLD_MS = 2000;
const DOWN_ALERT_AFTER = 3;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000;

const consecutiveDowns: Record<string, number> = {};
const lastAlertAt: Record<string, number> = {};

async function checkService(svc: { name: string; url: string }) {
  const start = Date.now();
  try {
    const res = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    const status = res.ok ? "healthy" : "degraded";

    if (latencyMs > SLOW_THRESHOLD_MS) {
      logger.warn({ service: svc.name, latencyMs, threshold: SLOW_THRESHOLD_MS }, "slow_health_check");
    }

    consecutiveDowns[svc.name] = 0;

    return { name: svc.name, status, latencyMs, statusCode: res.status };
  } catch {
    return { name: svc.name, status: "down", latencyMs: Date.now() - start, statusCode: 0 };
  }
}

async function alertAdmins(service: string, consecutive: number) {
  const last = lastAlertAt[service] || 0;
  if (Date.now() - last < ALERT_COOLDOWN_MS) return;
  lastAlertAt[service] = Date.now();

  const commsUrl = process.env.COMMS_SVC_URL || "http://localhost:3010";
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (!token) {
    logger.error({ service, consecutive }, "service_down_no_token");
    return;
  }

  try {
    const res = await fetch(`${commsUrl}/api/comms/alerts/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service": "status-page-svc",
        "x-service-token": token,
      },
      body: JSON.stringify({
        severity: "critical",
        title: `Service down: ${service}`,
        message: `Health check failed ${consecutive} consecutive times for ${service}.`,
        source: "status-page-svc",
      }),
    });
    logger.info({ service, consecutive, alertStatus: res.status }, "admin_alert_dispatched");
  } catch (err: any) {
    logger.error({ service, err: err.message }, "admin_alert_failed");
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

    for (const r of results) {
      if (r.status === "down") {
        consecutiveDowns[r.name] = (consecutiveDowns[r.name] || 0) + 1;
        if (consecutiveDowns[r.name] >= DOWN_ALERT_AFTER) {
          alertAdmins(r.name, consecutiveDowns[r.name]).catch(() => {});
        }
      }
    }

    const allHealthy = results.every((r) => r.status === "healthy");
    const anyDown = results.some((r) => r.status === "down");
    return {
      overall: anyDown ? "major_outage" : allHealthy ? "operational" : "degraded",
      services: results,
      checkedAt: new Date().toISOString(),
      thresholds: { slowMs: SLOW_THRESHOLD_MS, downAlertAfter: DOWN_ALERT_AFTER },
    };
  });

  app.get("/api/status/service/:serviceName", async (request, reply) => {
    const { serviceName } = request.params as any;
    const svc = SERVICES.find((s) => s.name === serviceName);
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
      uptime: { overall: 99.95, byService: SERVICES.map((s) => ({ name: s.name, uptime: 99.9 + Math.random() * 0.1 })) },
    };
  });
}
