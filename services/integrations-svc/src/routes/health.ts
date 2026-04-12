import { FastifyInstance } from "fastify";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/integrations/health", async () => ({
      status: "ok",
      service: "integrations-svc",
      timestamp: new Date().toISOString(),
    }));
  }
  