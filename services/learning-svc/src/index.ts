import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger, registerObservabilityPlugin } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { bootstrapOpsAlerts } from "@aivo/ops-alerts";
import { registerHealthRoutes } from "./routes/health.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerAuthHook } from "./lib/tenant.js";

const logger = createLogger("learning-svc");
// Read PORT first so the container picks up the value injected by the
// Dockerfile (ENV PORT=3000) and the Helm deploy (--set env.PORT=$PORT).
// LEARNING_PORT remains supported as a dev override; the literal default
// keeps `pnpm dev` working without any env config.
const PORT = parseInt(process.env.PORT || process.env.LEARNING_PORT || "3005", 10);

async function start() {
  const db = createDb(process.env.DATABASE_URL!);
  const app = Fastify({ logger: false });

  // Structured request logging + /metrics for Prometheus scrape (Supp A).
  registerObservabilityPlugin(app, "learning-svc");

  await app.register(cors, { origin: true, credentials: true });
  await app.register(swagger, {
    openapi: {
      info: { title: "AIVO Learning Service", version: "1.0.0" },
      servers: process.env.SWAGGER_SERVER_URL
        ? [{ url: process.env.SWAGGER_SERVER_URL }]
        : (process.env.NODE_ENV === "production" ? [] : [{ url: `http://localhost:${PORT}` }]),
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      },
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  registerHealthRoutes(app);
  registerAuthHook(app);
  registerSessionRoutes(app, db);

  await bootstrapOpsAlerts({ service: "learning-svc", app, beforeExit: () => app.close() });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Learning service listening on port ${PORT}`);
}

start().catch((err) => {
  logger.error(err, "Failed to start learning-svc");
  process.exit(1);
});
