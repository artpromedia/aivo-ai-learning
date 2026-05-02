import { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  const handler = async () => ({
    status: "ok",
    service: "family-svc",
    timestamp: new Date().toISOString(),
  });
  app.get("/health", handler);
  app.get("/api/family/health", handler);
}
