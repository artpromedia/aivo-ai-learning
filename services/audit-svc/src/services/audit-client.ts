/**
 * Flag-aware HTTP client for the enterprise audit-svc.
 *
 * Other services import `emitAuditEvent` to fire-and-forget an audit
 * record. The call is a no-op when `AIVO_FEATURE_DATA_GOVERNANCE_CENTER`
 * is off so legacy flows are unchanged. All network errors are swallowed.
 *
 * Sensitive metadata is run through `redactAuditMetadata` here too,
 * defense-in-depth on top of the redactor on the audit-svc side.
 */

import { redactAuditMetadata } from "./audit-redaction.js";

const DEFAULT_BASE_URL = process.env.AUDIT_SVC_URL ?? "http://localhost:3069";

function dataGovernanceCenterEnabled(): boolean {
  const raw = process.env.AIVO_FEATURE_DATA_GOVERNANCE_CENTER;
  if (!raw) return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export interface AuditEmitInput {
  tenantId?: string;
  actorId?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  learnerId?: string;
  beforeHash?: string;
  afterHash?: string;
  reason?: string;
  ipHash?: string;
  userAgentHash?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditClientOptions {
  baseUrl?: string;
  enabled?: boolean;
  fetchImpl?: typeof fetch;
}

export class AuditClient {
  private readonly baseUrl: string;
  private readonly enabled: boolean;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AuditClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.enabled = options.enabled ?? dataGovernanceCenterEnabled();
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async emit(input: AuditEmitInput): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.fetchImpl(`${this.baseUrl}/api/audit-events`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...input,
          metadata: redactAuditMetadata(input.metadata),
        }),
      });
    } catch {
      // Audit emission must never break the calling flow.
    }
  }
}

/**
 * Convenience module-level emitter. Most callers should use this; tests
 * can pass an explicit AuditClient with a fetch stub.
 */
export const defaultAuditClient = new AuditClient();

export async function emitAuditEvent(input: AuditEmitInput): Promise<void> {
  return defaultAuditClient.emit(input);
}
