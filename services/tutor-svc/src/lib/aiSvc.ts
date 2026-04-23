/**
 * Tiny HTTP client for ai-svc Speech Buddy endpoints.
 *
 * tutor-svc is the only intended caller of these internal endpoints. The
 * `x-internal-key` header is required and read from `INTERNAL_SERVICE_KEY`
 * (matches the comms-svc convention).
 */

const AI_SVC_URL = process.env.AI_SVC_URL || "http://localhost:3005";
const INTERNAL_KEY =
  process.env.INTERNAL_SERVICE_KEY ||
  (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");

async function call<T>(path: string, init: RequestInit & { method: "GET" | "POST" }): Promise<T> {
  const res = await fetch(`${AI_SVC_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-internal-key": INTERNAL_KEY,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const detail = body?.detail || body?.error || res.statusText;
    const err: any = new Error(`ai-svc ${path} failed: ${res.status} ${detail}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}

export interface StartSessionResponse {
  sessionId: string;
  ageBand: "6-9" | "10-12" | "13-15";
  locale: string;
  nicknameToken: string;
  state: string;
  startedAt: string;
  targetedSkills: string[];
}

export interface TurnResponse {
  buddyText: string;
  nextState: string;
  ended: boolean;
  endedReason: string | null;
  trace: {
    correlation_id: string;
    stt_ms: number;
    safety_in_ms: number;
    planner_ms: number;
    safety_out_ms: number;
    tts_ms: number;
    total_ms: number;
  };
  safetyFlags: Array<{
    category: string;
    severity: "soft" | "hard";
    source: "child_input" | "buddy_output";
    layer: "regex" | "classifier" | "llm_judge";
    correlationId: string;
    raisedAt: string;
  }>;
  skillEvidence: Array<{ skill: string; weight: number }>;
}

export interface EndSessionResponse {
  sessionId: string;
  endedReason: string;
  durationSeconds: number;
  turnCount: number;
  skillEvidenceTotals: Record<string, number>;
  badgesAwarded: string[];
  reflectionPrompts: string[];
  questAssigned: { quest: string; skill: string } | null;
  terminalSafetyFlag: {
    category: string;
    severity: string;
    correlationId: string;
    raisedAt: string;
  } | null;
  transcriptCiphertext: {
    tenant_id: string;
    nonce: string;
    ciphertext: string;
    algorithm: string;
  } | null;
}

export const aiSvc = {
  startSession(body: {
    tenantId: string;
    learnerId: string;
    ageBand: string;
    locale: string;
    consentRecordId: string;
    targetedSkills?: string[];
  }) {
    return call<StartSessionResponse>("/api/ai/speech-buddy/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  runTurn(sessionId: string, body: { text?: string; audioBase64?: string; mimeType?: string }) {
    return call<TurnResponse>(`/api/ai/speech-buddy/sessions/${encodeURIComponent(sessionId)}/turn`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  endSession(sessionId: string, reason: string) {
    return call<EndSessionResponse>(`/api/ai/speech-buddy/sessions/${encodeURIComponent(sessionId)}/end`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
};

export const __testing = { AI_SVC_URL, INTERNAL_KEY };
