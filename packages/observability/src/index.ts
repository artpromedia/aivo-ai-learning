import pino from "pino";
import { randomUUID } from "node:crypto";

export function createLogger(name: string) {
  return pino({
    name,
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;

export const REQUEST_ID_HEADER = "x-request-id";

export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Register a Fastify hook that reads x-request-id from the incoming request
 * (or generates one), echoes it on the response, and attaches it to the
 * request for downstream propagation. Use propagateHeaders(req) when calling
 * other services so the request ID flows through the stack.
 */
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

/**
 * Build a headers object that propagates the current request ID (and any
 * inherited internal-service identifiers) to downstream service calls.
 */
export function propagateHeaders(req: any, extra: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = { ...extra };
  if (req?.requestId) out[REQUEST_ID_HEADER] = req.requestId;
  return out;
}
