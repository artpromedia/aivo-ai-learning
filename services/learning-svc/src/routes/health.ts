import { FastifyInstance } from "fastify";
import { healthSchema } from "./schemas.js";

export function registerHealthRoutes(app: FastifyInstance) {
  const handler = async () => ({
    status: "ok",
    service: "learning-svc",
    timestamp: new Date().toISOString(),
  });
  app.get("/health", { schema: healthSchema }, handler);
  app.get("/api/learning/health", { schema: healthSchema }, handler);
}
