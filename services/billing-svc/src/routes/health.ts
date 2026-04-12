import { FastifyInstance } from "fastify";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/billing/health", async () => ({
      status: "ok",
      service: "billing-svc",
      timestamp: new Date().toISOString(),
    }));
  }
  