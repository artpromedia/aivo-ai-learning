import { FastifyInstance } from "fastify";

export function registerHealthRoutes(app: FastifyInstance) {
  const handler = async () => ({
    status: "ok",
    service: "admin-svc",
    timestamp: new Date().toISOString(),
  });
  app.get("/health", handler);
  app.get("/api/admin-svc/health", handler);
}
