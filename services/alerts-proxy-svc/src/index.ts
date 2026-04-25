import Fastify from "fastify";
import cors from "@fastify/cors";
import { createLogger } from "@aivo/observability";
import { loadChannels, REQUIRED_CHANNELS_IN_PROD, type ChannelConfig } from "./channels.js";

const logger = createLogger("alerts-proxy-svc");
const PORT = parseInt(process.env.ALERTS_PROXY_SVC_PORT || "3016", 10);
const IS_PROD = process.env.NODE_ENV === "production";

export async function buildServer(channels: ChannelConfig[] = loadChannels()) {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });

  app.get("/api/alerts/health", async () => {
    const configured = channels.filter((c) => c.configured).map((c) => c.id);
    const missing = REQUIRED_CHANNELS_IN_PROD.filter((id) => !configured.includes(id));
    return {
      status: "ok",
      service: "alerts-proxy-svc",
      timestamp: new Date().toISOString(),
      channels: configured,
      missingRequired: missing,
      productionReady: missing.length === 0,
    };
  });

  app.post("/api/alerts/page", async (req, reply) => {
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      return reply.code(400).send({ error: "missing body" });
    }
    const enabled = channels.filter((c) => c.configured);
    if (enabled.length === 0 && IS_PROD) {
      logger.error({}, "ops_alert.proxy.no_channels_in_prod");
      return reply.code(503).send({ error: "no channels configured" });
    }
    logger.info(
      { service: body.service, severity: body.severity, channels: enabled.map((c) => c.id) },
      "ops_alert.proxy.page",
    );
    return { delivered: enabled.map((c) => c.id), accepted: enabled.length };
  });

  return app;
}

async function start() {
  const channels = loadChannels();
  if (IS_PROD) {
    const missing = REQUIRED_CHANNELS_IN_PROD.filter((id) => !channels.find((c) => c.id === id && c.configured));
    if (missing.length > 0) {
      logger.warn(
        { missing },
        "alerts-proxy starting in production with missing channels — deploy smoke test should fail",
      );
    }
  }

  const app = await buildServer(channels);
  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info({ port: PORT, channels: channels.filter((c) => c.configured).map((c) => c.id) }, "alerts-proxy listening");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error("Failed to start alerts-proxy-svc:", err);
    process.exit(1);
  });
}
