/**
 * Safe-logging helper that refuses to emit raw IEP / parent / medical /
 * OCR / free-form chat text. Use this for any structured log payload that
 * touches learner-facing flows.
 *
 * The default Pino logger in `@aivo/observability` already strips
 * token/key/secret/password/credential/auth keys; this helper extends
 * that filter with enterprise-specific sensitive keys and a string-length
 * cap so long free-form text cannot leak through telemetry.
 */

const SENSITIVE_KEYS = new Set([
  "iepText",
  "rawIepText",
  "parentPrivateNotes",
  "parentNotes",
  "medicalNotes",
  "medicalDiagnosis",
  "freeFormChat",
  "learnerChat",
  "ocrText",
  "uploadedOcrText",
  "rawText",
  "password",
  "token",
  "secret",
  "apiKey",
]);

const MAX_STRING_LENGTH = 240;

export interface SafeLogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  payload: Record<string, unknown>;
}

export function redactForLogging(
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redactForLogging(value as Record<string, unknown>);
      continue;
    }
    if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
      out[key] = `${value.slice(0, MAX_STRING_LENGTH)}…`;
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function buildSafeLogEntry(
  level: SafeLogEntry["level"],
  message: string,
  payload: Record<string, unknown> = {},
): SafeLogEntry {
  return { level, message, payload: redactForLogging(payload) };
}
