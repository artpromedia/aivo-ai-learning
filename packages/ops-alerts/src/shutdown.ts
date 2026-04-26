import { createLogger } from "@aivo/observability";
import type { OpsAlertClient } from "./client.js";
import type { OpsAlertOutboxStore, ShutdownDrainOutcome } from "./types.js";

const logger = createLogger("ops-alerts:shutdown");

export interface InstallShutdownOptions {
  client: OpsAlertClient;
  /** Bounded final-flush window in ms. Default 5_000. */
  windowMs?: number;
  /** Optional durable store to persist envelopes that don't drain in time (#196). */
  durableStore?: OpsAlertOutboxStore;
  /** Signals to listen for. Default ["SIGTERM", "SIGINT"]. */
  signals?: NodeJS.Signals[];
  /** Called after the drain completes. Pass to status registry, etc. */
  onDrain?: (outcome: ShutdownDrainOutcome) => void | Promise<void>;
  /** Called to perform any other cleanup before process exit (server.close etc.). */
  beforeExit?: () => Promise<void> | void;
  /** When true (default true), the handler exits the process on completion. */
  exitOnComplete?: boolean;
}

export function installOpsAlertShutdown(opts: InstallShutdownOptions): () => void {
  const signals = opts.signals ?? ["SIGTERM", "SIGINT"];
  const windowMs = opts.windowMs ?? 5_000;
  let triggered = false;

  const handler = async (signal: NodeJS.Signals) => {
    if (triggered) return;
    triggered = true;
    opts.client.stopAutoFlush();
    logger.info({ signal }, "ops_alert.shutdown.start");
    let outcome: ShutdownDrainOutcome | null = null;
    try {
      outcome = await opts.client.drainForShutdown({ windowMs, durableStore: opts.durableStore });
    } catch (err: any) {
      logger.error({ err: err?.message }, "ops_alert.shutdown.drain_threw");
    }
    try {
      if (outcome && opts.onDrain) await opts.onDrain(outcome);
    } catch (err: any) {
      logger.error({ err: err?.message }, "ops_alert.shutdown.onDrain_threw");
    }
    try {
      if (opts.beforeExit) await opts.beforeExit();
    } catch (err: any) {
      logger.error({ err: err?.message }, "ops_alert.shutdown.beforeExit_threw");
    }
    if (opts.exitOnComplete !== false) {
      process.exit(outcome && outcome.lost > 0 && !opts.durableStore ? 1 : 0);
    }
  };

  const wrappers: Array<[NodeJS.Signals, NodeJS.SignalsListener]> = signals.map((s) => {
    const wrapper: NodeJS.SignalsListener = () => {
      void handler(s);
    };
    process.on(s, wrapper);
    return [s, wrapper];
  });

  return () => {
    for (const [s, w] of wrappers) process.off(s, w);
  };
}
