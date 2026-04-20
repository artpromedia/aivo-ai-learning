import { FastifyInstance } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { lessonSessions, lessonContent, gradebookEntries, learningPaths } from "@aivo/db";
import { generateLessonContent, getSubjectForTutor } from "../services/content-generator.js";
import { resolveTenantId } from "../lib/tenant.js";

const BRAIN_SVC_URL = process.env.BRAIN_SVC_URL || "http://localhost:3002";

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

export function registerSessionRoutes(app: FastifyInstance, db: any) {
  app.post("/api/learning/sessions", async (request, reply) => {
    const { learnerId, tutorSku, topic, contentType } = request.body as any;
    if (!learnerId || !tutorSku) {
      return reply.code(400).send({ error: "learnerId and tutorSku required" });
    }

    const subject = getSubjectForTutor(tutorSku);
    const brainContext = await fetchBrainContext(learnerId);
    const functioningLevel = (brainContext as any).functioning_level_profile?.level || "STANDARD";

    const tenantId = await resolveTenantId(request, db, learnerId);
    if (!tenantId) {
      return reply.code(400).send({ error: "Unable to resolve tenantId for learner" });
    }

    const [session] = await db.insert(lessonSessions).values({
      tenantId,
      learnerId,
      tutorSku,
      subject,
      status: "CONTENT_GENERATING",
      contentType: contentType || "LESSON",
      functioningLevel,
      brainContextSnapshot: brainContext,
    }).returning();

    try {
      const generated = await generateLessonContent({
        subject,
        topic: topic || `Introduction to ${subject}`,
        gradeTarget: (brainContext as any).curriculum_alignment?.grade_band || "THIRD",
        deliveryLevel: (brainContext as any).curriculum_alignment?.delivery_level || "THIRD",
        functioningLevel,
        brainContext,
        contentType: contentType || "LESSON",
      });

      await db.insert(lessonContent).values({
        sessionId: session.id,
        contentType: contentType || "LESSON",
        subject,
        topic: topic || `Introduction to ${subject}`,
        gradeTarget: (brainContext as any).curriculum_alignment?.grade_band || "THIRD",
        deliveryLevel: (brainContext as any).curriculum_alignment?.delivery_level || "THIRD",
        generatedContent: { raw: generated.content },
        qualityScore: generated.qualityScore,
        qualityGateLog: generated.qualityGateLog,
        promptTokens: generated.promptTokens,
        completionTokens: generated.completionTokens,
        modelUsed: generated.model,
      });

      if (!generated.qualityGatePassed) {
        await db.update(lessonSessions)
          .set({ status: "ABANDONED", sessionData: { error: "Content failed quality gate", qualityGateLog: generated.qualityGateLog } })
          .where(eq(lessonSessions.id, session.id));
        return reply.code(422).send({ error: "Content failed quality gate", qualityScore: generated.qualityScore, qualityGateLog: generated.qualityGateLog });
      }

      await db.update(lessonSessions)
        .set({ status: "CONTENT_READY" })
        .where(eq(lessonSessions.id, session.id));

      return { sessionId: session.id, status: "CONTENT_READY", content: generated.content, qualityScore: generated.qualityScore };
    } catch (err: any) {
      await db.update(lessonSessions)
        .set({ status: "ABANDONED", sessionData: { error: err.message } })
        .where(eq(lessonSessions.id, session.id));
      return reply.code(503).send({ error: "Content generation failed", detail: err.message });
    }
  });

  app.post("/api/learning/sessions/:sessionId/complete", async (request, reply) => {
    const { sessionId } = request.params as any;
    const { masteryUpdates, xpEarned } = request.body as any;

    const [session] = await db.select().from(lessonSessions).where(eq(lessonSessions.id, sessionId));
    if (!session) return reply.code(404).send({ error: "Session not found" });

    await db.update(lessonSessions).set({
      status: "COMPLETED",
      masteryAfter: masteryUpdates || {},
      xpEarned: xpEarned || 10,
      completedAt: new Date(),
      durationSeconds: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
    }).where(eq(lessonSessions.id, sessionId));

    if (masteryUpdates) {
      for (const [skill, score] of Object.entries(masteryUpdates)) {
        const existing = await db.select().from(gradebookEntries).where(
          and(eq(gradebookEntries.learnerId, session.learnerId), eq(gradebookEntries.skill, skill))
        );

        if (existing.length > 0) {
          await db.update(gradebookEntries).set({
            masteryScore: score as number,
            attemptsCount: (existing[0].attemptsCount || 0) + 1,
            lastAssessedAt: new Date(),
            trend: (score as number) > (existing[0].masteryScore || 0) ? "improving" : (score as number) < (existing[0].masteryScore || 0) ? "declining" : "stable",
            updatedAt: new Date(),
          }).where(eq(gradebookEntries.id, existing[0].id));
        } else {
          await db.insert(gradebookEntries).values({
            tenantId: session.tenantId,
            learnerId: session.learnerId,
            subject: session.subject,
            skill,
            masteryScore: score as number,
            attemptsCount: 1,
            lastAssessedAt: new Date(),
          });
        }
      }
    }

    return { status: "COMPLETED", sessionId };
  });

  app.post("/api/learning/gradebook/update", async (request, reply) => {
    const serviceToken = request.headers["x-service-token"];
    const authHeader = request.headers.authorization;
    const isInternalCall = request.headers["x-internal-service"] === "tutor-svc";

    if (!serviceToken && !authHeader && !isInternalCall) {
      const remoteIp = request.ip;
      if (remoteIp && !remoteIp.startsWith("127.") && remoteIp !== "::1" && !remoteIp.startsWith("172.")) {
        return reply.code(401).send({ error: "Authentication required" });
      }
    }

    const { learnerId, skill, masteryScore, sessionType, xpEarned } = request.body as any;
    if (!learnerId || !skill) {
      return reply.code(400).send({ error: "learnerId and skill required" });
    }

    const tenantId = await resolveTenantId(request, db, learnerId);
    if (!tenantId) {
      return reply.code(400).send({ error: "Unable to resolve tenantId for learner" });
    }

    const existing = await db.select().from(gradebookEntries).where(
      and(eq(gradebookEntries.learnerId, learnerId), eq(gradebookEntries.skill, skill))
    );

    if (existing.length > 0) {
      await db.update(gradebookEntries).set({
        masteryScore: masteryScore ?? existing[0].masteryScore,
        attemptsCount: (existing[0].attemptsCount || 0) + 1,
        lastAssessedAt: new Date(),
        trend: masteryScore > (existing[0].masteryScore || 0) ? "improving" : masteryScore < (existing[0].masteryScore || 0) ? "declining" : "stable",
        updatedAt: new Date(),
      }).where(eq(gradebookEntries.id, existing[0].id));
    } else {
      await db.insert(gradebookEntries).values({
        tenantId,
        learnerId,
        subject: skill.replace("homework_", ""),
        skill,
        masteryScore: masteryScore || 0,
        attemptsCount: 1,
        lastAssessedAt: new Date(),
      });
    }

    return { status: "updated", skill, masteryScore };
  });

  app.get("/api/learning/sessions", async (request) => {
    const { learnerId } = request.query as any;
    if (!learnerId) return [];

    const sessions = await db.select().from(lessonSessions)
      .where(eq(lessonSessions.learnerId, learnerId))
      .orderBy(desc(lessonSessions.startedAt))
      .limit(20);
    return sessions;
  });

  app.get("/api/learning/gradebook/:learnerId", async (request) => {
    const { learnerId } = request.params as any;
    const entries = await db.select().from(gradebookEntries)
      .where(eq(gradebookEntries.learnerId, learnerId))
      .orderBy(desc(gradebookEntries.updatedAt));
    return entries;
  });

  app.get("/api/learning/path/:learnerId/:subject", async (request, reply) => {
    const { learnerId, subject } = request.params as any;
    const [path] = await db.select().from(learningPaths)
      .where(and(eq(learningPaths.learnerId, learnerId), eq(learningPaths.subject, subject)));

    if (!path) {
      const tenantId = await resolveTenantId(request, db, learnerId);
      if (!tenantId) {
        return { error: "Unable to resolve tenantId for learner" };
      }
      const [newPath] = await db.insert(learningPaths).values({
        tenantId,
        learnerId,
        subject,
        topicSequence: getDefaultTopics(subject),
        completedTopics: [],
        masteryMap: {},
      }).returning();
      return newPath;
    }

    return path;
  });

  app.post("/api/learning/path/:learnerId/:subject/init", async (request, reply) => {
    const { learnerId, subject } = request.params as any;
    const { functioning_level } = request.body as any;

    const [existing] = await db.select().from(learningPaths)
      .where(and(eq(learningPaths.learnerId, learnerId), eq(learningPaths.subject, subject)));

    if (existing) {
      return { status: "already_exists", path: existing };
    }

    const topicSequence = getDefaultTopics(subject);

    const tenantId = await resolveTenantId(request, db, learnerId);
    if (!tenantId) {
      return reply.code(400).send({ error: "Unable to resolve tenantId for learner" });
    }

    const [newPath] = await db.insert(learningPaths).values({
      tenantId,
      learnerId,
      subject,
      topicSequence,
      completedTopics: [],
      masteryMap: {},
    }).returning();

    return { status: "created", path: newPath };
  });
}

function getDefaultTopics(subject: string): string[] {
  const topicMap: Record<string, string[]> = {
    Mathematics: ["Number Sense", "Addition & Subtraction", "Multiplication", "Division", "Fractions", "Decimals", "Geometry", "Measurement", "Data & Graphs", "Word Problems"],
    "English Language Arts": ["Letter Recognition", "Phonics", "Sight Words", "Reading Fluency", "Reading Comprehension", "Vocabulary", "Sentence Structure", "Paragraph Writing", "Story Writing", "Grammar"],
    Science: ["Living Things", "Plants", "Animals", "Human Body", "Weather", "Earth & Space", "Matter & Materials", "Force & Motion", "Energy", "Scientific Method"],
    "History & Social Studies": ["Community", "Maps & Geography", "American Symbols", "Native Americans", "Colonial America", "American Revolution", "Civil War", "20th Century", "Government", "Citizenship"],
    "Coding & Computer Science": ["Sequences", "Loops", "Conditionals", "Variables", "Functions", "Debugging", "Algorithms", "Data Structures", "Web Basics", "Game Design"],
    "Speech & Language": ["Articulation", "Vocabulary Building", "Sentence Formation", "Conversation Skills", "Listening Comprehension", "Pragmatic Language", "Narrative Skills", "Following Directions", "Answering Questions", "Social Communication"],
    "Social-Emotional Learning": ["Emotion Identification", "Self-Regulation", "Empathy", "Friendship Skills", "Conflict Resolution", "Growth Mindset", "Self-Advocacy", "Coping Strategies", "Gratitude", "Mindfulness"],
  };
  return topicMap[subject] || ["Introduction", "Foundations", "Core Concepts", "Practice", "Application", "Review"];
}
