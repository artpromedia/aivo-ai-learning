/**
 * Mobile session API client.
 *
 * Loads a learner stage session from learning-svc. Returns a typed
 * `Session` with a `stagePlan.beats` array that the mobile stage runtime
 * dispatches by `beat.kind`.
 *
 * Strict no-demo policy (Sprint 01 gate): if the server does not return a
 * usable stage plan, this client throws `SessionUnavailableError`. The
 * stage UI surfaces an error state rather than substituting demo content.
 */

import { apiFetch } from "@/lib/api";
import { API } from "@/constants/api";
import type {
  Beat,
  ChoiceBeat,
  Session,
  StagePlan,
  SessionMeta,
} from "@/src/types/stage";

export class SessionUnavailableError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SessionUnavailableError";
  }
}

interface RawSessionResponse {
  id?: string;
  sessionId?: string;
  learnerId?: string;
  tutorSku?: string;
  subject?: string;
  topic?: string;
  status?: string;
  functioningLevel?: string;
  startedAt?: string;
  completedAt?: string | null;
  stagePlan?: { beats?: Beat[] };
  lessonContent?: {
    generatedContent?: { stagePlan?: { beats?: Beat[] }; raw?: string };
  };
}

function coerceMeta(raw: RawSessionResponse, sessionId: string): SessionMeta {
  return {
    id: raw.id ?? raw.sessionId ?? sessionId,
    learnerId: raw.learnerId ?? "",
    tutorSku: raw.tutorSku ?? "",
    subject: raw.subject ?? "",
    topic: raw.topic,
    status: (raw.status as SessionMeta["status"]) ?? "CONTENT_READY",
    functioningLevel: raw.functioningLevel ?? "MIDDLE",
    startedAt: raw.startedAt,
    completedAt: raw.completedAt ?? null,
  };
}

function isBeat(value: unknown): value is Beat {
  if (!value || typeof value !== "object") return false;
  const v = value as { kind?: unknown; id?: unknown };
  return (
    typeof v.id === "string" &&
    typeof v.kind === "string" &&
    ["choice", "math-expression", "surface", "tutor-turn"].includes(v.kind)
  );
}

function extractStagePlan(raw: RawSessionResponse): StagePlan | null {
  const candidates: Array<Beat[] | undefined> = [
    raw.stagePlan?.beats,
    raw.lessonContent?.generatedContent?.stagePlan?.beats,
  ];
  for (const beats of candidates) {
    if (Array.isArray(beats) && beats.length > 0 && beats.every(isBeat)) {
      return { beats };
    }
  }
  return null;
}

export const sessionClient = {
  async getSession(sessionId: string): Promise<Session> {
    if (!sessionId) {
      throw new SessionUnavailableError("Missing session id");
    }

    let res: Response;
    try {
      res = await apiFetch(API.LEARNING, `/api/learning/sessions/${sessionId}`);
    } catch (err: any) {
      throw new SessionUnavailableError(
        `Network error loading session: ${err?.message ?? "unknown"}`,
      );
    }

    if (!res.ok) {
      throw new SessionUnavailableError(
        `Server returned ${res.status} for session ${sessionId}`,
        res.status,
      );
    }

    const raw = (await res.json()) as RawSessionResponse;
    const stagePlan = extractStagePlan(raw);
    if (!stagePlan) {
      throw new SessionUnavailableError(
        "Server did not return a stage plan for this session.",
      );
    }
    return { meta: coerceMeta(raw, sessionId), stagePlan };
  },

  /**
   * Submit a per-beat answer. Server-of-record acknowledges via 2xx.
   * Used by `MobileStageRuntime` for per-beat scoring updates.
   */
  async submitBeatResponse(params: {
    sessionId: string;
    learnerId: string;
    beat: ChoiceBeat | Beat;
    answer: string;
    correct: boolean;
  }): Promise<void> {
    const { sessionId, learnerId, beat, answer, correct } = params;
    const skill = (beat as ChoiceBeat).skill ?? `beat_${beat.id}`;
    const res = await apiFetch(API.LEARNING, "/api/learning/gradebook/update", {
      method: "POST",
      body: JSON.stringify({
        learnerId,
        sessionId,
        skill,
        masteryScore: correct ? 100 : 0,
        sessionType: "LESSON",
        xpEarned: correct ? 10 : 2,
        beatId: beat.id,
        answer,
      }),
    });
    if (!res.ok) {
      throw new Error(`gradebook update failed: ${res.status}`);
    }
  },

  async completeSession(params: {
    sessionId: string;
    masteryUpdates: Record<string, number>;
    xpEarned: number;
    beatsCompleted?: number;
  }): Promise<void> {
    const res = await apiFetch(
      API.LEARNING,
      `/api/learning/sessions/${params.sessionId}/complete`,
      {
        method: "POST",
        body: JSON.stringify({
          masteryUpdates: params.masteryUpdates,
          xpEarned: params.xpEarned,
          beatsCompleted: params.beatsCompleted,
        }),
      },
    );
    if (!res.ok) throw new Error(`complete failed: ${res.status}`);
  },
};
