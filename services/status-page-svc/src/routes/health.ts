import { FastifyInstance } from "fastify";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/status/health", async () => ({
      status: "ok",
      service: "status-page-svc",
      timestamp: new Date().toISOString(),
    }));
  }
  