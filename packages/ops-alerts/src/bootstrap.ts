import type { FastifyInstance } from "fastify";
import { OpsAlertClient } from "./client.js";
import { opsAlertOutboxStoreFromEnv } from "./stores/factory.js";
import { FileOpsAlertOutboxStore } from "./stores/file.js";
import { installOpsAlertShutdown } from "./shutdown.js";
import { installFatalErrorPager } from "./fatal.js";
import type { OpsAlertOutboxStore, ShutdownDrainOutcome } from "./types.js";
import type { PgOutboxClient } from "./stores/postgres.js";

export interface OpsAlertBootstrapOptions {
  service: string;
  app?: FastifyInstance;
  pgOutboxClient?: () => PgOutboxClient | Promise<PgOutboxClient>;
  /** Optional fallback durable store path. Used when the primary store is the
   *  in-memory store but the operator wants surrendered envelopes from
   *  shutdown to survive across restarts (#196). Defaults to the value of
   *  OPS_ALERTS_SHUTDOWN_PERSIST_PATH if set. */
  shutdownPersistPath?: string;
  beforeExit?: () => Promise<void> | void;
  /** Receives the shutdown outcome before exit (e.g. forward to a status registry). */
  onShutdown?: (outcome: ShutdownDrainOutcome) => Promise<void> | void;
  /** Defaults to true. Set false in tests where you don't want signal handlers. */
  installSignalHandlers?: boolean;
  /** Defaults to true. Set false in tests so a thrown unhandledRejection doesn't kill the worker. */
  installFatalHandler?: boolean;
}

export interface OpsAlertBootstrap {
  client: OpsAlertClient;
  outbox: OpsAlertOutboxStore;
  durableStore: OpsAlertOutboxStore | undefined;
  pgRequestedButUnwired: boolean;
}

/**
 * One-call setup for any Fastify service that pages on-call: builds the
 * outbox store from env, instantiates an OpsAlertClient, registers the
 * /api/internal/ops-alerts-outbox endpoint (for status-page scraping),
 * installs the fatal-error pager and the SIGTERM/SIGINT drain handler.
 *
 * Required env when calling: ALERTS_PROXY_URL.
 * Optional env: OPS_ALERTS_OUTBOX_PG_TABLE, OPS_ALERTS_OUTBOX_FILE_PATH,
 *   OPS_ALERTS_AUTOFLUSH_MS, OPS_ALERTS_SHUTDOWN_WINDOW_MS,
 *   OPS_ALERTS_SHUTDOWN_PERSIST_PATH, INTERNAL_SERVICE_TOKEN.
 */
export async function bootstrapOpsAlerts(opts: OpsAlertBootstrapOptions): Promise<OpsAlertBootstrap> {
  const proxyUrl = process.env.ALERTS_PROXY_URL || "http://alerts-proxy-svc:3016";
  const { store, pgRequestedButUnwired } = await opsAlertOutboxStoreFromEnv({
    service: opts.service,
    pgOutboxClient: opts.pgOutboxClient,
  });

  const client = new OpsAlertClient({
    service: opts.service,
    proxyUrl,
    outbox: store,
    autoFlushIntervalMs: parseInt(process.env.OPS_ALERTS_AUTOFLUSH_MS || "30000", 10),
  });
  client.startAutoFlush();

  const persistPath = opts.shutdownPersistPath ?? process.env.OPS_ALERTS_SHUTDOWN_PERSIST_PATH ?? undefined;
  const durableStore: OpsAlertOutboxStore | undefined =
    persistPath && store.kind === "memory" ? new FileOpsAlertOutboxStore(persistPath) : undefined;

  if (opts.app) {
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;
    opts.app.get("/api/internal/ops-alerts-outbox", async (req, reply) => {
      if (expectedToken && req.headers["x-service-token"] !== expectedToken) {
        return reply.code(401).send({ error: "missing or invalid x-service-token" });
      }
      return await client.stats_();
    });

    // Prometheus-format exposition (#209). Same auth as JSON endpoint.
    opts.app.get("/api/internal/metrics/ops-alerts-outbox", async (req, reply) => {
      if (expectedToken && req.headers["x-service-token"] !== expectedToken) {
        return reply.code(401).send("# unauthorized\n");
      }
      const stats = await client.stats_();
      const labels = `{service="${stats.service}",store="${stats.storeKind}"}`;
      const lines = [
        `# HELP ops_alerts_outbox_depth Current depth of the on-call outbox.`,
        `# TYPE ops_alerts_outbox_depth gauge`,
        `ops_alerts_outbox_depth${labels} ${stats.depth}`,
        `# HELP ops_alerts_outbox_enqueued_total Total envelopes enqueued.`,
        `# TYPE ops_alerts_outbox_enqueued_total counter`,
        `ops_alerts_outbox_enqueued_total${labels} ${stats.enqueuedTotal}`,
        `# HELP ops_alerts_outbox_drained_total Total envelopes successfully delivered.`,
        `# TYPE ops_alerts_outbox_drained_total counter`,
        `ops_alerts_outbox_drained_total${labels} ${stats.drainedTotal}`,
        `# HELP ops_alerts_outbox_dropped_total Total envelopes dropped (e.g. shutdown_timeout).`,
        `# TYPE ops_alerts_outbox_dropped_total counter`,
        `ops_alerts_outbox_dropped_total${labels} ${stats.droppedTotal}`,
        `# HELP ops_alerts_auto_flush_ticks_total Auto-flush ticks attempted.`,
        `# TYPE ops_alerts_auto_flush_ticks_total counter`,
        `ops_alerts_auto_flush_ticks_total${labels} ${stats.autoFlushTicksTotal}`,
        `# HELP ops_alerts_auto_flush_drained_total Envelopes drained during auto-flush.`,
        `# TYPE ops_alerts_auto_flush_drained_total counter`,
        `ops_alerts_auto_flush_drained_total${labels} ${stats.autoFlushDrainedTotal}`,
        `# HELP ops_alerts_auto_flush_errors_total Errors caught inside the auto-flush tick.`,
        `# TYPE ops_alerts_auto_flush_errors_total counter`,
        `ops_alerts_auto_flush_errors_total${labels} ${stats.autoFlushErrorsTotal}`,
        `# HELP ops_alerts_last_auto_flush_seconds Unix timestamp of the most recent auto-flush tick.`,
        `# TYPE ops_alerts_last_auto_flush_seconds gauge`,
        `ops_alerts_last_auto_flush_seconds${labels} ${
          stats.lastAutoFlushAt ? Math.floor(new Date(stats.lastAutoFlushAt).getTime() / 1000) : 0
        }`,
      ];
      reply.header("content-type", "text/plain; version=0.0.4; charset=utf-8");
      return lines.join("\n") + "\n";
    });
  }

  if (opts.installFatalHandler !== false) {
    installFatalErrorPager({ client, service: opts.service });
  }

  if (opts.installSignalHandlers !== false) {
    installOpsAlertShutdown({
      client,
      windowMs: parseInt(process.env.OPS_ALERTS_SHUTDOWN_WINDOW_MS || "5000", 10),
      durableStore,
      onDrain: opts.onShutdown,
      beforeExit: opts.beforeExit,
    });
  }

  return { client, outbox: store, durableStore, pgRequestedButUnwired };
}
