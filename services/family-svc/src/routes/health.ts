import { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/api/family/health", async () => {
    return { status: "ok", service: "family-svc", timestamp: new Date().toISOString() };
  });
}
