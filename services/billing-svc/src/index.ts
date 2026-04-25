import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { installOpsAlertShutdown, installFatalErrorPager } from "@aivo/ops-alerts";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPlanRoutes } from "./routes/plans.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import { registerOpsAlertsInternalRoutes } from "./routes/ops-alerts-internal.js";
import { buildBillingOpsAlerts } from "./lib/ops-alerts.js";

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

  const opsAlerts = await buildBillingOpsAlerts();
  if (opsAlerts.pgRequestedButUnwired) {
    logger.warn(
      { table: process.env.OPS_ALERTS_OUTBOX_PG_TABLE },
      "billing-svc: OPS_ALERTS_OUTBOX_PG_TABLE is set but pgOutboxClient was not wired",
    );
  }
  opsAlerts.client.startAutoFlush();

  registerHealthRoutes(app);
  registerPlanRoutes(app, db);
  registerWebhookRoutes(app);
  registerOpsAlertsInternalRoutes(app, opsAlerts.client);

  installFatalErrorPager({ client: opsAlerts.client, service: "billing-svc" });
  installOpsAlertShutdown({
    client: opsAlerts.client,
    windowMs: parseInt(process.env.OPS_ALERTS_SHUTDOWN_WINDOW_MS || "5000", 10),
    beforeExit: async () => {
      await app.close();
    },
  });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(
    { port: PORT, outboxKind: opsAlerts.outbox.kind },
    "AIVO Billing Service listening",
  );
}

start().catch((err) => {
  console.error("Failed to start billing-svc:", err);
  process.exit(1);
});
