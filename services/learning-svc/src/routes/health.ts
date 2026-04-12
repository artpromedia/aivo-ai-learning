import { FastifyInstance } from "fastify";

export function registerHealthRoutes(app: FastifyInstance) {
  const handler = async () => ({ status: "ok", service: "learning-svc" });
  app.get("/health", handler);
  app.get("/api/learning/health", handler);
}
