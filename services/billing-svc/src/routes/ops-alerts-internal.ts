import { FastifyInstance } from "fastify";
import type { OpsAlertClient } from "@aivo/ops-alerts";

/**
 * Internal endpoint scraped by status-page-svc /api/status/ops-alerts-outbox.
 * Returns the per-service outbox stats (depth, totals, last shutdown, auto-flush).
 *
 * Authentication: gated by INTERNAL_SERVICE_TOKEN matching the
 * x-service-token header. Status-page already sends this header.
 */
export function registerOpsAlertsInternalRoutes(app: FastifyInstance, client: OpsAlertClient) {
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  app.get("/api/internal/ops-alerts-outbox", async (req, reply) => {
    if (expectedToken && req.headers["x-service-token"] !== expectedToken) {
      return reply.code(401).send({ error: "missing or invalid x-service-token" });
    }
    return await client.stats_();
  });
}
