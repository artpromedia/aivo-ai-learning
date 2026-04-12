import Fastify from "fastify";
import cors from "@fastify/cors";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { initKeys } from "@aivo/security";
import { registerHealthRoutes } from "./routes/health.js";
import { registerCollaborationRoutes } from "./routes/collaboration.js";
import { registerRecommendationRoutes } from "./routes/recommendations.js";
import { registerIepRoutes } from "./routes/iep.js";

const logger = createLogger("family-svc");
const PORT = parseInt(process.env.FAMILY_PORT || "3007", 10);

async function start() {
  await initKeys();

  const db = createDb(process.env.DATABASE_URL!);

  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });

  app.decorate("db", db);

  await registerHealthRoutes(app);
  await registerCollaborationRoutes(app);
  await registerRecommendationRoutes(app);
  await registerIepRoutes(app);

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Family service listening on port ${PORT}`);
}

start().catch((err) => {
  logger.error(err, "Failed to start family-svc");
  process.exit(1);
});
