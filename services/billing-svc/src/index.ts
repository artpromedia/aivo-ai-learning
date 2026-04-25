import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import postgres from "postgres";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { bootstrapOpsAlerts, postgresJsOutboxClient } from "@aivo/ops-alerts";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPlanRoutes } from "./routes/plans.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";

const logger = createLogger("billing-svc");
const PORT = parseInt(process.env.BILLING_SVC_PORT || "3009", 10);

async function start() {
  const db = createDb(process.env.DATABASE_URL!);
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(swagger, {
    openapi: {
      info: { title: "AIVO Billing Service", version: "1.0.0" },
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
  registerPlanRoutes(app, db);
  registerWebhookRoutes(app);

  let sharedSql: ReturnType<typeof postgres> | null = null;
  const opsAlerts = await bootstrapOpsAlerts({
    service: "billing-svc",
    app,
    pgOutboxClient: process.env.OPS_ALERTS_OUTBOX_PG_TABLE
      ? () => {
          if (!sharedSql) sharedSql = postgres(process.env.DATABASE_URL!, { max: 2 });
          return postgresJsOutboxClient(sharedSql as any);
        }
      : undefined,
    beforeExit: async () => {
      await app.close();
      if (sharedSql) await sharedSql.end({ timeout: 1 });
    },
  });

  if (opsAlerts.pgRequestedButUnwired) {
    logger.warn(
      { table: process.env.OPS_ALERTS_OUTBOX_PG_TABLE },
      "billing-svc: OPS_ALERTS_OUTBOX_PG_TABLE is set but pgOutboxClient was not wired",
    );
  }

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info({ port: PORT, outboxKind: opsAlerts.outbox.kind }, "AIVO Billing Service listening");
}

start().catch((err) => {
  console.error("Failed to start billing-svc:", err);
  process.exit(1);
});
