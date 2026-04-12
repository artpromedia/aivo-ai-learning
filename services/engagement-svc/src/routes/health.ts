import { FastifyInstance } from "fastify";

export function registerHealthRoutes(app: FastifyInstance) {
  app.get("/api/engagement/health", async () => ({
    status: "ok",
    service: "engagement-svc",
    timestamp: new Date().toISOString(),
  }));
}
