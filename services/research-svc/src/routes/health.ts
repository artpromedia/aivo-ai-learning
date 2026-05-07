import { FastifyInstance } from "fastify";
import { healthSchema } from "./schemas.js";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/research/health", { schema: healthSchema }, async () => ({
      status: "ok",
      service: "research-svc",
      timestamp: new Date().toISOString(),
    }));
  }
