import Fastify from "fastify";
import cors from "@fastify/cors";
import { createLogger, registerObservabilityPlugin } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { bootstrapOpsAlerts } from "@aivo/ops-alerts";
import { initKeys } from "@aivo/security";
import { registerHealthRoutes } from "./routes/health.js";
import { registerCollaborationRoutes } from "./routes/collaboration.js";
import { registerRecommendationRoutes } from "./routes/recommendations.js";
import { registerIepRoutes } from "./routes/iep.js";
import { registerTransitionRoutes } from "./routes/transition.js";
import { registerLanguageProfileRoutes } from "./routes/language-profile.js";
import { registerDataExportRoutes } from "./routes/data-export.js";
import { registerParentDashboardRoutes } from "./routes/parent-dashboard.js";
import { registerObservationRoutes } from "./routes/observations.js";
import { registerSpeechBuddyConsentRoutes } from "./routes/speech-buddy-consent.js";
import { registerWhatsWorkingRoutes } from "./routes/whats-working.js";

const logger = createLogger("family-svc");
const PORT = parseInt(process.env.FAMILY_PORT || "3007", 10);

async function start() {
  await initKeys();

  const db = createDb(process.env.DATABASE_URL!);

  const app = Fastify({ logger: false });

  // Structured request logging + /metrics for Prometheus scrape (Supp A).
  registerObservabilityPlugin(app, "family-svc");

  await app.register(cors, { origin: true, credentials: true });

  app.decorate("db", db);

  await registerHealthRoutes(app);
  await registerCollaborationRoutes(app);
  await registerRecommendationRoutes(app);
  await registerIepRoutes(app);
  await registerTransitionRoutes(app);
  await registerLanguageProfileRoutes(app);
  await registerDataExportRoutes(app);
  await registerParentDashboardRoutes(app);
  await registerObservationRoutes(app);
  await registerSpeechBuddyConsentRoutes(app);
  await registerWhatsWorkingRoutes(app);

  await bootstrapOpsAlerts({ service: "family-svc", app, beforeExit: () => app.close() });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Family service listening on port ${PORT}`);
}

start().catch((err) => {
  logger.error(err, "Failed to start family-svc");
  process.exit(1);
});
