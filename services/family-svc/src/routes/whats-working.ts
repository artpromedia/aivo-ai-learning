/**
 * Parent-dashboard "what's working" route — task: reframe the dashboard
 * around patterns parents can take to an IEP meeting.
 *
 * The route accepts session rows from the host (so the family-svc does
 * not have to own the full session schema for this first cut) and
 * returns the same `WhatsWorkingInsights` shape produced by the pure
 * analytics module. A follow-up will wire the row source to
 * `assessmentAttempts` / engagement events directly.
 */
import { FastifyInstance } from "fastify";
import { authenticateRequest, verifyParentOwnership } from "../auth.js";
import {
  computeWhatsWorking,
  type SessionRow,
} from "../services/whats-working.js";

interface WhatsWorkingBody {
  rows?: SessionRow[];
  windowDays?: number;
}

/**
 * Cap on rows accepted per request. >30 days of sessions for any
 * realistic learner; bounds compute and memory per call so an
 * authenticated caller cannot trigger amplified analytics work.
 */
const MAX_ROWS_PER_REQUEST = 5_000;

/** Simple per-subject token bucket: ≤ BURST requests / WINDOW_MS. */
const RATE_BURST = 30;
const RATE_WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(subject: string, now: number): boolean {
  const b = buckets.get(subject);
  if (!b || b.resetAt <= now) {
    buckets.set(subject, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_BURST) return false;
  b.count += 1;
  return true;
}

export async function registerWhatsWorkingRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.post("/api/family/whats-working/:learnerId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    if (!rateLimit(auth.sub, Date.now())) {
      return reply.code(429).send({ error: "Too many requests" });
    }
    const { learnerId } = req.params as { learnerId: string };
    const owns = await verifyParentOwnership(db, auth.sub, learnerId);
    if (!owns) return reply.code(403).send({ error: "Forbidden" });

    const body = (req.body ?? {}) as WhatsWorkingBody;
    const rawRows = Array.isArray(body.rows) ? body.rows : [];
    if (rawRows.length > MAX_ROWS_PER_REQUEST) {
      return reply
        .code(413)
        .send({ error: `rows exceeds maximum of ${MAX_ROWS_PER_REQUEST}` });
    }
    const windowDays =
      typeof body.windowDays === "number" && body.windowDays > 0
        ? Math.floor(body.windowDays)
        : 30;

    const insights = computeWhatsWorking(rawRows, { windowDays });
    return insights;
  });
}

