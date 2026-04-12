import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { TUTORS } from "@aivo/brand";
import { tutorSessions } from "@aivo/db";

const AI_SVC_URL = process.env.AI_SVC_URL || "http://localhost:3004";
const BRAIN_SVC_URL = process.env.BRAIN_SVC_URL || "http://localhost:3002";

const TUTOR_SKU_TO_KEY: Record<string, string> = {
  ADDON_TUTOR_MATH: "nova",
  ADDON_TUTOR_ELA: "sage",
  ADDON_TUTOR_SCIENCE: "spark",
  ADDON_TUTOR_HISTORY: "chrono",
  ADDON_TUTOR_CODING: "pixel",
  ADDON_TUTOR_SPEECH: "echo",
  ADDON_TUTOR_SEL: "harmony",
  ADDON_TUTOR_SOCIAL_STUDIES: "atlas",
  ADDON_TUTOR_ARTS: "cadence",
  ADDON_TUTOR_PE_HEALTH: "vigor",
  ADDON_TUTOR_LANGUAGES: "lingua",
  ADDON_TUTOR_STEM_DESIGN: "forge",
  ADDON_TUTOR_LIFE_SKILLS: "compass",
  ADDON_TUTOR_CREATIVE_WRITING: "muse",
};

const TUTOR_NAME_MAP: Record<string, string> = {};
for (const [sku, key] of Object.entries(TUTOR_SKU_TO_KEY)) {
  const tutor = TUTORS[key as keyof typeof TUTORS];
  if (tutor) TUTOR_NAME_MAP[sku] = tutor.name;
}

async function fetchBrainContext(learnerId: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${BRAIN_SVC_URL}/api/brain/${learnerId}`);
    if (res.ok) {
      const data = await res.json();
      return data.state || {};
    }
  } catch {}
  return {};
}

export function registerChatRoutes(app: FastifyInstance, db: any) {
  app.post("/api/tutor/session/start", async (request, reply) => {
    const { learnerId, tutorSku, sessionType } = request.body as any;
    if (!learnerId || !tutorSku) {
      return reply.code(400).send({ error: "learnerId and tutorSku required" });
    }

    const tutorName = TUTOR_NAME_MAP[tutorSku] || "Tutor";
    const brainContext = await fetchBrainContext(learnerId);
    const functioningLevel = (brainContext as any).functioning_level_profile?.level || "STANDARD";

    const [session] = await db.insert(tutorSessions).values({
      tenantId: "00000000-0000-0000-0000-000000000001",
      learnerId,
      tutorSku,
      tutorName,
      sessionType: sessionType || "standard",
      functioningLevel,
      brainContext,
      messages: [],
    }).returning();

    return { sessionId: session.id, tutorName, functioningLevel };
  });

  app.post("/api/tutor/session/:sessionId/message", async (request, reply) => {
    const { sessionId } = request.params as any;
    const { message } = request.body as any;
    if (!message) return reply.code(400).send({ error: "message required" });

    const [session] = await db.select().from(tutorSessions).where(eq(tutorSessions.id, sessionId));
    if (!session) return reply.code(404).send({ error: "Session not found" });

    const existingMessages = (session.messages as any[]) || [];
    existingMessages.push({ role: "user", content: message, timestamp: new Date().toISOString() });

    const chatMessages = existingMessages.map((m: any) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${AI_SVC_URL}/api/ai/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_sku: session.tutorSku,
          learner_id: session.learnerId,
          functioning_level: session.functioningLevel || "STANDARD",
          brain_context: session.brainContext || {},
          messages: chatMessages,
        }),
      });

      if (!res.ok) {
        throw new Error(`ai-svc returned ${res.status}`);
      }

      const data = await res.json();
      existingMessages.push({ role: "assistant", content: data.response, timestamp: new Date().toISOString() });

      await db.update(tutorSessions).set({
        messages: existingMessages,
      }).where(eq(tutorSessions.id, sessionId));

      return {
        response: data.response,
        model: data.model,
        messageCount: existingMessages.length,
      };
    } catch (err: any) {
      return reply.code(503).send({ error: "Tutor chat failed", detail: err.message });
    }
  });

  app.post("/api/tutor/session/:sessionId/complete", async (request, reply) => {
    const { sessionId } = request.params as any;
    const { masteryUpdates, xpEarned } = request.body as any;

    const [session] = await db.select().from(tutorSessions).where(eq(tutorSessions.id, sessionId));
    if (!session) return reply.code(404).send({ error: "Session not found" });

    const messages = (session.messages as any[]) || [];
    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    await db.update(tutorSessions).set({
      masteryUpdates: masteryUpdates || {},
      xpEarned: xpEarned || Math.min(messages.length * 5, 50),
      durationSeconds,
      completedAt: new Date(),
      completionQuality: Math.min(1.0, messages.length / 10),
    }).where(eq(tutorSessions.id, sessionId));

    return { status: "completed", sessionId, durationSeconds, xpEarned: xpEarned || Math.min(messages.length * 5, 50) };
  });

  app.get("/api/tutor/sessions/:learnerId", async (request) => {
    const { learnerId } = request.params as any;
    const sessions = await db.select().from(tutorSessions)
      .where(eq(tutorSessions.learnerId, learnerId))
      .orderBy(desc(tutorSessions.startedAt))
      .limit(20);
    return sessions;
  });

  app.get("/api/tutor/session/:sessionId", async (request, reply) => {
    const { sessionId } = request.params as any;
    const [session] = await db.select().from(tutorSessions).where(eq(tutorSessions.id, sessionId));
    if (!session) return reply.code(404).send({ error: "Session not found" });
    return session;
  });
}
