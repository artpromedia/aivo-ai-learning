import { FastifyInstance } from "fastify";

export function registerHealthRoutes(app: FastifyInstance) {
  const handler = async () => ({ status: "ok", service: "tutor-svc" });
  app.get("/health", handler);
  app.get("/api/tutors/health", handler);
}
