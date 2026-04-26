import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { bootstrapOpsAlerts } from "@aivo/ops-alerts";
import { registerHealthRoutes } from "./routes/health.js";
import { registerParentAssessmentRoutes } from "./routes/parent-assessment.js";
import { registerAssessmentRoutes } from "./routes/assessments.js";
import { registerIepRoutes } from "./routes/iep.js";
import { registerIepEvaluationRoutes } from "./routes/iep-evaluations.js";
import { registerIepAuthoringRoutes } from "./routes/iep-authoring.js";
import { registerIepCollabRoutes } from "./routes/iep-collab.js";
import { registerIepUpdatesRoutes, checkReviewReminders } from "./routes/iep-updates.js";
import { registerIepParentShareRoutes } from "./routes/iep-parent-share.js";
import { registerLearnerBaselineRoutes } from "./routes/learner-baseline.js";
import { registerSensoryProfileRoutes } from "./routes/sensory-profile.js";

const logger = createLogger("assessment-svc");
const PORT = parseInt(process.env.ASSESSMENT_PORT || "3003", 10);

async function start() {
  const db = createDb(process.env.DATABASE_URL!);
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(swagger, {
    openapi: {
      info: { title: "AIVO Assessment Service", version: "1.0.0" },
      servers: process.env.SWAGGER_SERVER_URL
        ? [{ url: process.env.SWAGGER_SERVER_URL }]
        : (process.env.NODE_ENV === "production" ? [] : [{ url: `http://localhost:${PORT}` }]),
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
  await registerIepEvaluationRoutes(app);
  await registerIepAuthoringRoutes(app);
  await registerIepCollabRoutes(app);
  await registerIepUpdatesRoutes(app);
  await registerIepParentShareRoutes(app);
  await registerLearnerBaselineRoutes(app);
  await registerSensoryProfileRoutes(app);

  await bootstrapOpsAlerts({ service: "assessment-svc", app, beforeExit: () => app.close() });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Assessment service listening on port ${PORT}`);

  // Phase D — fire annual review reminders (90/60/30 days). Once on boot
  // (catches anything missed while the service was down) and then daily.
  // Idempotent at the row level, so multiple instances racing is safe.
  setTimeout(() => {
    checkReviewReminders(db).catch((err) => logger.error(err, "Initial reminder run failed"));
  }, 30_000);
  setInterval(() => {
    checkReviewReminders(db).catch((err) => logger.error(err, "Daily reminder run failed"));
  }, 24 * 60 * 60 * 1000);
}

start().catch((err) => {
  logger.error(err, "Failed to start assessment-svc");
  process.exit(1);
});
