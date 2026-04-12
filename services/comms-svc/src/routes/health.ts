import { FastifyInstance } from "fastify";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/comms/health", async () => ({
      status: "ok",
      service: "comms-svc",
      timestamp: new Date().toISOString(),
    }));
  }
  