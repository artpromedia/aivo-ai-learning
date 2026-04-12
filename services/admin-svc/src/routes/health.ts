import { FastifyInstance } from "fastify";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/admin-svc/health", async () => ({
      status: "ok",
      service: "admin-svc",
      timestamp: new Date().toISOString(),
    }));
  }
  