import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { InMemoryAuditStore, type AuditStore } from "./services/audit-store.js";
import { registerAuditEventRoutes } from "./routes/audit-events.js";
import { registerAuditReportRoutes } from "./routes/reports.js";

export async function buildApp(options: { store?: AuditStore } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const store = options.store ?? new InMemoryAuditStore();
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "audit-svc" }));
  registerAuditEventRoutes(app, store);
  registerAuditReportRoutes(app, store);
  return app;
}
