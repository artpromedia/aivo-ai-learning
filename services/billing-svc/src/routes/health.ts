import { FastifyInstance } from "fastify";
import { healthRootSchema, healthSchema } from "./schemas.js";

export function registerHealthRoutes(app: FastifyInstance) {
  const handler = async () => ({
    status: "ok",
    service: "billing-svc",
    timestamp: new Date().toISOString(),
  });
  app.get("/health", { schema: healthRootSchema }, handler);
  app.get("/api/billing/health", { schema: healthSchema }, handler);
}
