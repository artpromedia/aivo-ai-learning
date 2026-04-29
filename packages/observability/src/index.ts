import pino from "pino";
import { randomUUID } from "node:crypto";

// ── Sensitive-key sanitisation ─────────────────────────────────────────────

const SENSITIVE_KEY_RE = /token|key|secret|password|credential|auth/i;

/**
 * Recursively strips any key whose name matches the sensitive-key pattern
 * from the supplied object. The original object is not mutated.
 */
export function sanitize<T>(data: T, depth = 0): T {
  if (depth > 10 || data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map((v) => sanitize(v, depth + 1)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(k)) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = sanitize(v, depth + 1);
    }
  }
  return out as T;
}

// ── Logger factory ─────────────────────────────────────────────────────────

export interface Logger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

export function createLogger(serviceName: string, context?: Record<string, unknown>): Logger {
  const base = pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) { return { level: label }; },
    },
    base: context ? sanitize({ service: serviceName, ...context }) : { service: serviceName },
  });

  function log(level: "info" | "warn" | "error" | "debug", message: string, data?: Record<string, unknown>) {
    const safeData = data ? sanitize(data) : {};
    base[level](safeData, message);
  }

  return {
    info: (msg, data) => log("info", msg, data),
    warn: (msg, data) => log("warn", msg, data),
    error: (msg, data) => log("error", msg, data),
    debug: (msg, data) => log("debug", msg, data),
  };
}

// ── Legacy createLogger compat (returns pino instance for existing consumers) ──
export { createLogger as createPinoLogger };
export type { Logger as PinoLogger };

// ── Metrics registry ───────────────────────────────────────────────────────

interface LabelSet { [label: string]: string }

export interface Counter {
  increment(value?: number, labelValues?: LabelSet): void;
}

export interface Histogram {
  record(value: number, labelValues?: LabelSet): void;
}

interface CounterState {
  name: string;
  labels: string[];
  counts: Map<string, number>;
}

interface HistogramState {
  name: string;
  labels: string[];
  buckets: number[];
  bucketCounts: Map<string, number[]>;
  sums: Map<string, number>;
  counts: Map<string, number>;
}

const _counters: CounterState[] = [];
const _histograms: HistogramState[] = [];

function labelKey(labelValues: LabelSet): string {
  return JSON.stringify(labelValues, Object.keys(labelValues).sort());
}

export function createCounter(name: string, labels: string[] = []): Counter {
  const state: CounterState = { name, labels, counts: new Map() };
  _counters.push(state);
  return {
    increment(value = 1, labelValues: LabelSet = {}) {
      const key = labelKey(labelValues);
      state.counts.set(key, (state.counts.get(key) ?? 0) + value);
    },
  };
}

const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export function createHistogram(
  name: string,
  buckets: number[] = DEFAULT_BUCKETS,
  labels: string[] = [],
): Histogram {
  const state: HistogramState = { name, labels, buckets, bucketCounts: new Map(), sums: new Map(), counts: new Map() };
  _histograms.push(state);
  return {
    record(value: number, labelValues: LabelSet = {}) {
      const key = labelKey(labelValues);
      const bc = state.bucketCounts.get(key) ?? new Array(state.buckets.length + 1).fill(0);
      for (let i = 0; i < state.buckets.length; i++) {
        if (value <= state.buckets[i]) bc[i] += 1;
      }
      bc[state.buckets.length] += 1; // +Inf bucket
      state.bucketCounts.set(key, bc);
      state.sums.set(key, (state.sums.get(key) ?? 0) + value);
      state.counts.set(key, (state.counts.get(key) ?? 0) + 1);
    },
  };
}

export function exportMetrics(): string {
  const lines: string[] = [];

  for (const c of _counters) {
    lines.push(`# TYPE ${c.name} counter`);
    for (const [labelsJson, val] of c.counts) {
      const lv = JSON.parse(labelsJson) as LabelSet;
      const labelStr = Object.entries(lv)
        .map(([k, v]) => `${k}="${v}"`)
        .join(",");
      lines.push(labelStr ? `${c.name}{${labelStr}} ${val}` : `${c.name} ${val}`);
    }
  }

  for (const h of _histograms) {
    lines.push(`# TYPE ${h.name} histogram`);
    for (const [labelsJson, bc] of h.bucketCounts) {
      const lv = JSON.parse(labelsJson) as LabelSet;
      const base = Object.entries(lv)
        .map(([k, v]) => `${k}="${v}"`)
        .join(",");
      h.buckets.forEach((b, i) => {
        const l = base ? `${base},le="${b}"` : `le="${b}"`;
        lines.push(`${h.name}_bucket{${l}} ${bc[i]}`);
      });
      const infL = base ? `${base},le="+Inf"` : `le="+Inf"`;
      lines.push(`${h.name}_bucket{${infL}} ${bc[h.buckets.length]}`);
      const suffix = base ? `{${base}}` : "";
      lines.push(`${h.name}_sum${suffix} ${h.sums.get(labelsJson) ?? 0}`);
      lines.push(`${h.name}_count${suffix} ${h.counts.get(labelsJson) ?? 0}`);
    }
  }

  return lines.join("\n");
}

/** Reset all metric state (for tests only). */
export function _resetMetrics(): void {
  _counters.length = 0;
  _histograms.length = 0;
}

// ── Trace span helper ──────────────────────────────────────────────────────

export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes: Record<string, string> = {},
): Promise<T> {
  const startMs = Date.now();
  let threw = false;
  try {
    return await fn();
  } catch (err) {
    threw = true;
    throw err;
  } finally {
    const durationMs = Date.now() - startMs;
    // Emit to stdout as a structured log line so it can be forwarded to an
    // OTel collector later without code changes.
    process.stdout.write(
      JSON.stringify({
        level: "trace",
        span: name,
        durationMs,
        threw,
        ...attributes,
        timestamp: new Date().toISOString(),
      }) + "\n",
    );
  }
}

// ── Request ID propagation (unchanged from original) ──────────────────────

export const REQUEST_ID_HEADER = "x-request-id";

export function generateRequestId(): string {
  return randomUUID();
}

export function registerRequestIdHook(app: any) {
  app.addHook("onRequest", async (req: any, reply: any) => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id =
      typeof incoming === "string" && incoming.length > 0 && incoming.length <= 128
        ? incoming
        : generateRequestId();
    req.requestId = id;
    reply.header(REQUEST_ID_HEADER, id);
  });
}

export function propagateHeaders(req: any, extra: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = { ...extra };
  if (req?.requestId) out[REQUEST_ID_HEADER] = req.requestId;
  return out;
}

// ── Re-export Fastify plugin for convenience ───────────────────────────────
export { registerObservabilityPlugin } from "./fastify-plugin.js";
