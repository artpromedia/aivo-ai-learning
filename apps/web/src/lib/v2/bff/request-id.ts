/**
 * Request-ID helper. Every BFF call has a request id that flows
 * through to upstream services and is echoed back to the client in
 * the response body and the `x-request-id` response header. The id
 * is short, URL-safe, and reused from the incoming request when
 * present.
 */
const INCOMING_HEADERS = [
  "x-request-id",
  "x-correlation-id",
  "x-amzn-trace-id",
] as const;

const VALID_ID_PATTERN = /^[a-zA-Z0-9._\-:=/]{4,128}$/;

export function getOrCreateRequestId(request: Request): string {
  for (const name of INCOMING_HEADERS) {
    const value = request.headers.get(name);
    if (value && VALID_ID_PATTERN.test(value)) return value;
  }
  return generateRequestId();
}

export function generateRequestId(): string {
  // Use `crypto.randomUUID` where available, with a base36 fallback
  // for runtimes that don't expose it (test sandboxes, edge runtimes
  // without the WebCrypto surface).
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  const a = Math.floor(Math.random() * 1e12).toString(36);
  const b = Date.now().toString(36);
  return `req_${b}_${a}`;
}
