import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { logAdminEnterpriseFlags, registerAdminIpAllowlist } from "@aivo/security";
import {
  startSafeCron,
  createDrizzleAdvisoryLock,
  createDrizzleLedger,
} from "@aivo/scheduling";
import { registerHealthRoutes } from "./routes/health.js";
import { registerPlatformRoutes } from "./routes/platform.js";
import { registerAuditRoutes } from "./routes/audit.js";
import { registerAuditVerifyRoutes } from "./routes/audit-verify.js";
import { registerSearchRoutes } from "./routes/search.js";
import { registerLeadRoutes } from "./routes/leads.js";
import { registerModerationRoutes } from "./routes/moderation.js";
import { registerComplianceRoutes } from "./routes/compliance.js";
import { registerApiKeyRoutes } from "./routes/api-keys.js";
import { registerScimTokenRoutes } from "./routes/scim-tokens.js";
import { registerEvidenceRoutes } from "./routes/evidence.js";
import { registerJobsRoutes } from "./routes/jobs.js";
import { registerAdminInternalJobRoutes } from "./routes/internal-jobs.js";
import { startEvidenceCron } from "./lib/soc2-evidence.js";
import { startWatchdog } from "./lib/watchdog.js";
import { runJanitorOnce } from "./lib/janitor.js";
import { runAuditRetentionOnce } from "./lib/audit-retention.js";

const logger = createLogger("admin-svc");
const PORT = parseInt(process.env.ADMIN_SVC_PORT || "3013", 10);

async function start() {
  logAdminEnterpriseFlags(logger);
  const db = createDb(process.env.DATABASE_URL!);
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(swagger, {
    openapi: {
      info: { title: "AIVO Admin Service", version: "1.0.0" },
      servers: [{ url: `http://localhost:${PORT}` }],
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      },
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  registerHealthRoutes(app);
  registerPlatformRoutes(app, db);
  registerAdminIpAllowlist(app);
  registerAuditRoutes(app, db);
  registerAuditVerifyRoutes(app, db);
  registerSearchRoutes(app, db);
  registerLeadRoutes(app, db);
  registerModerationRoutes(app, db);
  registerComplianceRoutes(app, db);
  registerApiKeyRoutes(app, db);
  registerScimTokenRoutes(app, db);
  registerEvidenceRoutes(app, db);
  registerJobsRoutes(app, db);

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`AIVO Admin Service listening on port ${PORT}`);

  // Schedulers — these run regardless of which replica is leader; the
  // shared scheduler picks one via the advisory lock.
  const evidenceHandle = startEvidenceCron(db, logger);
  const lock = createDrizzleAdvisoryLock(db as any);
  const ledger = createDrizzleLedger(db as any);
  const janitorHandle = startSafeCron({
    jobName: "admin.run-history-janitor",
    ledger,
    lock,
    log: logger,
    run: () => runJanitorOnce(db),
  });
  const retentionHandle = startSafeCron({
    jobName: "admin.audit-retention",
    ledger,
    lock,
    log: logger,
    run: () => runAuditRetentionOnce(db),
  });
  registerAdminInternalJobRoutes(app, {
    "admin.soc2-evidence": evidenceHandle,
    "admin.run-history-janitor": janitorHandle,
    "admin.audit-retention": retentionHandle,
  });
  startWatchdog(db, { log: logger });
}

start().catch((err) => {
  console.error("Failed to start admin-svc:", err);
  process.exit(1);
});
