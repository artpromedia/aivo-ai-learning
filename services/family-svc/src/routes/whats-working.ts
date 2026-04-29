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

export async function registerWhatsWorkingRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.post("/api/family/whats-working/:learnerId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { learnerId } = req.params as { learnerId: string };
    const owns = await verifyParentOwnership(db, auth.sub, learnerId);
    if (!owns) return reply.code(403).send({ error: "Forbidden" });

    const body = (req.body ?? {}) as WhatsWorkingBody;
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const windowDays =
      typeof body.windowDays === "number" && body.windowDays > 0
        ? Math.floor(body.windowDays)
        : 30;

    const insights = computeWhatsWorking(rows, { windowDays });
    return insights;
  });
}
