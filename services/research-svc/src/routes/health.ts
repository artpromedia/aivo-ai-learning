import { FastifyInstance } from "fastify";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/research/health", async () => ({
      status: "ok",
      service: "research-svc",
      timestamp: new Date().toISOString(),
    }));
  }
  