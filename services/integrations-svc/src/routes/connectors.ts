import { FastifyInstance } from "fastify";
import { verifyJWT } from "@aivo/security";

const CONNECTORS = [
  { id: "google_classroom", name: "Google Classroom", status: "available", category: "lms" },
  { id: "clever", name: "Clever", status: "available", category: "sis" },
  { id: "canvas", name: "Canvas LMS", status: "available", category: "lms" },
  { id: "schoology", name: "Schoology", status: "planned", category: "lms" },
  { id: "powerschool", name: "PowerSchool", status: "planned", category: "sis" },
  { id: "classlink", name: "ClassLink", status: "planned", category: "sso" },
];

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

export function registerConnectorRoutes(app: FastifyInstance, db: any) {
  app.get("/api/integrations/connectors", async () => {
    return { connectors: CONNECTORS };
  });

  app.get("/api/integrations/connectors/:connectorId", async (request, reply) => {
    const { connectorId } = request.params as any;
    const connector = CONNECTORS.find(c => c.id === connectorId);
    if (!connector) return reply.code(404).send({ error: "Connector not found" });
    return connector;
  });

  app.post("/api/integrations/connect", { preHandler: requireAdmin }, async (request, reply) => {
    const { tenantId, connectorId, credentials } = request.body as any;
    if (!tenantId || !connectorId) return reply.code(400).send({ error: "tenantId and connectorId required" });
    return {
      status: "connected",
      connectionId: crypto.randomUUID(),
      tenantId,
      connectorId,
      connectedAt: new Date().toISOString(),
    };
  });

  app.delete("/api/integrations/disconnect/:connectionId", { preHandler: requireAdmin }, async (request) => {
    const { connectionId } = request.params as any;
    return { status: "disconnected", connectionId };
  });

  app.get("/api/integrations/connections/:tenantId", { preHandler: requireAuth }, async (request, reply) => {
    const { tenantId } = request.params as any;
    const user = (request as any).user;
    if (user.tenantId !== tenantId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return { tenantId, connections: [] };
  });

  app.post("/api/integrations/sync/:connectionId", { preHandler: requireAdmin }, async (request) => {
    const { connectionId } = request.params as any;
    return {
      status: "sync_started",
      connectionId,
      syncId: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
    };
  });

  app.get("/api/integrations/sync/:connectionId/status", { preHandler: requireAuth }, async (request) => {
    const { connectionId } = request.params as any;
    return { connectionId, lastSync: null, status: "idle", recordsSynced: 0 };
  });
}
