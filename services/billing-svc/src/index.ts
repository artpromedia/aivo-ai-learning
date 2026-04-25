import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import {
  startSafeCron,
  createDrizzleAdvisoryLock,
  createDrizzleLedger,
} from "@aivo/scheduling";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPlanRoutes } from "./routes/plans.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import { registerDailyJobsRoutes } from "./routes/daily-jobs.js";
import { registerCouponRoutes } from "./routes/coupons.js";
import { registerInternalJobRoutes } from "./routes/internal-jobs.js";
import { runExpiryBatchForScheduler } from "./lib/expiryReminderService.js";

const logger = createLogger("billing-svc");
const PORT = parseInt(process.env.BILLING_SVC_PORT || "3009", 10);

async function start() {
  const db = createDb(process.env.DATABASE_URL!);
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(swagger, {
    openapi: {
      info: { title: "AIVO Billing Service", version: "1.0.0" },
      servers: [{ url: `http://localhost:${PORT}` }],
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      },
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  const lock = createDrizzleAdvisoryLock(db as any);
  const ledger = createDrizzleLedger(db as any);
  const expiryHandle = startSafeCron({
    jobName: "billing.daily-expiry-reminders",
    ledger,
    lock,
    log: logger,
    run: () => runExpiryBatchForScheduler(db),
  });

  registerHealthRoutes(app);
  registerPlanRoutes(app, db);
  registerWebhookRoutes(app);
  registerDailyJobsRoutes(app, db);
  registerCouponRoutes(app, db);
  registerInternalJobRoutes(app, {
    "billing.daily-expiry-reminders": expiryHandle,
  });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`AIVO Billing Service listening on port ${PORT}`);
}

start().catch((err) => {
  console.error("Failed to start billing-svc:", err);
  process.exit(1);
});
