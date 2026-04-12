import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { registerHealthRoutes } from "./routes/health.js";
import { registerParentAssessmentRoutes } from "./routes/parent-assessment.js";
import { registerAssessmentRoutes } from "./routes/assessments.js";
import { registerIepRoutes } from "./routes/iep.js";
import { registerLearnerBaselineRoutes } from "./routes/learner-baseline.js";

const logger = createLogger("assessment-svc");
const PORT = parseInt(process.env.ASSESSMENT_PORT || "3003", 10);

async function start() {
  const db = createDb(process.env.DATABASE_URL!);
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(swagger, {
    openapi: {
      info: { title: "AIVO Assessment Service", version: "1.0.0" },
      servers: [{ url: `http://localhost:${PORT}` }],
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      },
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  app.decorate("db", db);

  await registerHealthRoutes(app);
  await registerParentAssessmentRoutes(app);
  await registerAssessmentRoutes(app);
  await registerIepRoutes(app);
  await registerLearnerBaselineRoutes(app);

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Assessment service listening on port ${PORT}`);
}

start().catch((err) => {
  logger.error(err, "Failed to start assessment-svc");
  process.exit(1);
});
