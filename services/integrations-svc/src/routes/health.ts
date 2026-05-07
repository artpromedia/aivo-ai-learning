import { FastifyInstance } from "fastify";
import { healthSchema } from "./schemas.js";

  export function registerHealthRoutes(app: FastifyInstance) {
    app.get("/api/integrations/health", { schema: healthSchema }, async () => ({
      status: "ok",
      service: "integrations-svc",
      timestamp: new Date().toISOString(),
    }));
  }
  