import { FastifyInstance } from "fastify";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/i18n/health", async () => ({
      status: "ok",
      service: "i18n-svc",
      timestamp: new Date().toISOString(),
    }));
  }
  