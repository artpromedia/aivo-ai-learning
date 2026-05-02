import { FastifyInstance } from "fastify";

export function registerHealthRoutes(app: FastifyInstance) {
  const handler = async () => ({
    status: "ok",
    service: "comms-svc",
    timestamp: new Date().toISOString(),
  });
  app.get("/health", handler);
  app.get("/api/comms/health", handler);
}
