import { FastifyInstance } from "fastify";
import { healthSchema } from "./schemas.js";

export function registerHealthRoutes(app: FastifyInstance) {
  app.get("/api/engagement/health", { schema: healthSchema }, async () => ({
    status: "ok",
    service: "engagement-svc",
    timestamp: new Date().toISOString(),
  }));
}
