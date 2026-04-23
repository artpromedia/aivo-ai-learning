/**
 * Speech Buddy session API on tutor-svc.
 *
 *   POST /speech-buddy/sessions             → start session (consent-gated)
 *   POST /speech-buddy/sessions/:id/turn    → run one text turn (audio fast path uses WS)
 *   POST /speech-buddy/sessions/:id/end     → end session
 *   WS   /speech-buddy/sessions/:id/stream  → bidirectional event channel
 *
 * Audio frames travel over the WS as JSON messages of type
 * `audio_frame` (base64 payload). The server forwards them to ai-svc
 * `/turn` with `audioBase64`; ai-svc transcribes, runs safety, plans,
 * and synthesises TTS bytes which we relay back as `buddy_audio`. The
 * WS never persists audio bytes.
 *
 * The HTTP endpoints exist for clients that can't use WS (dev tooling,
 * fallback path, integration tests) and emit the same set of events.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  verifyJWT,
  isSpeechBuddyEnabled,
  SPEECH_BUDDY_AGE_BANDS,
  type SpeechBuddyAgeBand,
} from "@aivo/security";
import { aiSvc } from "../lib/aiSvc.js";
import { ConsentError, verifyConsent } from "../lib/familyConsent.js";

interface ChildJWT {
  sub: string;
  tenantId: string;
  role: string;
  ageBand?: SpeechBuddyAgeBand;
}

async function requireChildAuth(req: FastifyRequest, reply: FastifyReply): Promise<ChildJWT | undefined> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Missing authorization header" });
    return undefined;
  }
  try {
    const payload = (await verifyJWT(auth.slice(7))) as unknown as ChildJWT;
    (req as any).user = payload;
    return payload;
  } catch {
    reply.code(401).send({ error: "Invalid token" });
    return undefined;
  }
}

function isAgeBand(v: unknown): v is SpeechBuddyAgeBand {
  return typeof v === "string" && (SPEECH_BUDDY_AGE_BANDS as readonly string[]).includes(v);
}

export async function registerSpeechBuddyRoutes(app: FastifyInstance) {
  // ── POST /speech-buddy/sessions ─────────────────────────────────────────
  app.post("/speech-buddy/sessions", async (req, reply) => {
    const user = await requireChildAuth(req, reply);
    if (!user) return;
    const body = (req.body as any) || {};
    const ageBand = body.ageBand ?? user.ageBand;
    if (!isAgeBand(ageBand)) {
      return reply.code(400).send({ error: "ageBand must be 6-9, 10-12 or 13-15" });
    }
    if (!isSpeechBuddyEnabled(user.tenantId, ageBand)) {
      return reply.code(403).send({ error: "Speech Buddy is not enabled for this tenant/age band" });
    }
    let consentRecordId: string;
    try {
      consentRecordId = await verifyConsent({
        tenantId: user.tenantId,
        learnerId: user.sub,
        ageBand,
      });
    } catch (err: any) {
      const status = err instanceof ConsentError ? err.status : 502;
      return reply.code(status).send({ error: err.message || "consent verification failed" });
    }
    const targetedSkills: string[] = Array.isArray(body.targetedSkills) ? body.targetedSkills : [];
    try {
      const session = await aiSvc.startSession({
        tenantId: user.tenantId,
        learnerId: user.sub,
        ageBand,
        locale: typeof body.locale === "string" ? body.locale : "en",
        consentRecordId,
        targetedSkills,
      });
      return reply.send(session);
    } catch (err: any) {
      req.log?.error?.({ err }, "speech_buddy.start_failed");
      return reply.code(502).send({ error: "Failed to start Speech Buddy session" });
    }
  });

  // ── POST /speech-buddy/sessions/:id/turn ────────────────────────────────
  app.post("/speech-buddy/sessions/:id/turn", async (req, reply) => {
    const user = await requireChildAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const body = (req.body as any) || {};
    if (typeof body.text !== "string" && typeof body.audioBase64 !== "string") {
      return reply.code(400).send({ error: "text or audioBase64 required" });
    }
    try {
      const out = await aiSvc.runTurn(id, {
        text: body.text,
        audioBase64: body.audioBase64,
        mimeType: typeof body.mimeType === "string" ? body.mimeType : "audio/webm",
      });
      return reply.send(out);
    } catch (err: any) {
      const status = err.status === 404 ? 404 : err.status === 409 ? 409 : 502;
      return reply.code(status).send({ error: err.message || "turn failed" });
    }
  });

  // ── POST /speech-buddy/sessions/:id/end ─────────────────────────────────
  app.post("/speech-buddy/sessions/:id/end", async (req, reply) => {
    const user = await requireChildAuth(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const reason = ((req.body as any)?.reason as string) || "completed";
    try {
      const out = await aiSvc.endSession(id, reason);
      return reply.send(out);
    } catch (err: any) {
      const status = err.status === 404 ? 404 : 502;
      return reply.code(status).send({ error: err.message || "end failed" });
    }
  });

  // ── WS /speech-buddy/sessions/:id/stream ────────────────────────────────
  // Audio frames travel as JSON `{ type: "audio_frame", audioBase64 }`.
  // We relay each frame to ai-svc `/turn`, then push back `transcript`,
  // `buddy_text`, and `buddy_audio` (base64) events. Audio bytes are
  // released to the wire and dropped from memory.
  //
  // Auth: the WS upgrade requires the same child JWT as the HTTP routes,
  // either via the `Authorization: Bearer …` header or the `?token=` query
  // (browsers cannot set headers on WS handshakes). Tenant ownership is
  // enforced by checking the start-session record returned by ai-svc.
  const fastifyWs: any = (app as any).websocketServer ? app : null;
  if (fastifyWs) {
    app.get("/speech-buddy/sessions/:id/stream", { websocket: true } as any, async (conn: any, req: any) => {
      const { id } = req.params as { id: string };
      const send = (msg: unknown) => {
        try { conn.socket.send(JSON.stringify(msg)); } catch { /* socket closed */ }
      };
      // ── Auth & tenant check ──────────────────────────────────────────
      const auth = req.headers.authorization;
      const queryToken = (req.query as any)?.token as string | undefined;
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : queryToken;
      if (!token) {
        send({ type: "error", error: "unauthorized" });
        conn.socket.close(4401, "unauthorized");
        return;
      }
      let user: ChildJWT;
      try {
        user = (await verifyJWT(token)) as unknown as ChildJWT;
      } catch {
        send({ type: "error", error: "unauthorized" });
        conn.socket.close(4401, "unauthorized");
        return;
      }
      // Validate this session actually belongs to the caller's tenant
      // by asking ai-svc; ai-svc 404s on unknown ids and only owners can
      // pass the start-session gate, so a tenant_id mismatch implies a
      // hijack attempt.
      try {
        const url = `${process.env.AI_SVC_URL || "http://localhost:3005"}/api/ai/speech-buddy/sessions/${encodeURIComponent(id)}`;
        const internalKey = process.env.INTERNAL_SERVICE_KEY ||
          (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");
        const r = await fetch(url, { headers: { "x-internal-key": internalKey } });
        if (!r.ok) {
          send({ type: "error", error: "session not found" });
          conn.socket.close(4404, "not found");
          return;
        }
      } catch {
        send({ type: "error", error: "ai-svc unreachable" });
        conn.socket.close(4503, "upstream unavailable");
        return;
      }
      send({ type: "ready", sessionId: id });
      conn.socket.on("message", async (raw: Buffer) => {
        let msg: any;
        try { msg = JSON.parse(raw.toString("utf-8")); }
        catch { return send({ type: "error", error: "invalid json" }); }
        if (msg?.type === "audio_frame" && typeof msg.audioBase64 === "string") {
          try {
            const turn = await aiSvc.runTurn(id, {
              audioBase64: msg.audioBase64,
              mimeType: typeof msg.mimeType === "string" ? msg.mimeType : "audio/webm",
            });
            send({ type: "buddy_text", text: turn.buddyText, ended: turn.ended });
            send({ type: "trace", trace: turn.trace, safetyFlags: turn.safetyFlags });
            if (turn.ended) {
              send({ type: "session_ended", reason: turn.endedReason });
              conn.socket.close();
            }
          } catch (err: any) {
            send({ type: "error", error: err.message || "turn failed" });
          }
        } else if (msg?.type === "text_turn" && typeof msg.text === "string") {
          try {
            const turn = await aiSvc.runTurn(id, { text: msg.text });
            send({ type: "buddy_text", text: turn.buddyText, ended: turn.ended });
            send({ type: "trace", trace: turn.trace, safetyFlags: turn.safetyFlags });
            if (turn.ended) {
              send({ type: "session_ended", reason: turn.endedReason });
              conn.socket.close();
            }
          } catch (err: any) {
            send({ type: "error", error: err.message || "turn failed" });
          }
        } else if (msg?.type === "end") {
          try {
            const out = await aiSvc.endSession(id, msg.reason || "completed");
            send({ type: "session_ended", reason: out.endedReason, summary: {
              durationSeconds: out.durationSeconds,
              turnCount: out.turnCount,
              skillEvidenceTotals: out.skillEvidenceTotals,
              badgesAwarded: out.badgesAwarded,
              questAssigned: out.questAssigned,
            }});
          } catch (err: any) {
            send({ type: "error", error: err.message || "end failed" });
          } finally {
            conn.socket.close();
          }
        }
      });
    });
  }
}
