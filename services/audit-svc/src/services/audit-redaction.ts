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

export function redactAuditMetadata(
  metadata: Record<string, unknown> | undefined | null,
): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object") return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = "[redacted]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redactAuditMetadata(value as Record<string, unknown>);
      continue;
    }
    if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
      result[key] = `${value.slice(0, MAX_STRING_LENGTH)}…`;
      continue;
    }
    result[key] = value;
  }
  return result;
}
