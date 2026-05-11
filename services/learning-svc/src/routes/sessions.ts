import { FastifyInstance } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { lessonSessions, lessonContent, gradebookEntries, learningPaths } from "@aivo/db";
import { generateLessonContent, getSubjectForTutor, fetchPersonalizedTopics } from "../services/content-generator.js";
import { computeLessonXp, computeCompletionQuality, type LessonSignals } from "../services/scoring.js";
import { fetchBrainContext as fetchNormalizedBrainContext, type NormalizedBrainContext } from "../services/brain-context.js";
import { validateStagePlan } from "../services/stageplan-validator.js";
import { resolveTenantId, requireLearnerAccess } from "../lib/tenant.js";
import {
  createSessionSchema,
  completeSessionSchema,
  updateGradebookSchema,
  listSessionsSchema,
  getGradebookSchema,
  getLearningPathSchema,
  initLearningPathSchema,
  refreshLearningPathTopicsSchema,
  advanceLearningPathSchema,
} from "./schemas.js";

const IS_PROD = process.env.NODE_ENV === "production";
function requireUrl(name: string, devDefault: string): string {
  const v = process.env[name];
  if (v) return v;
  if (IS_PROD) throw new Error(`learning-svc: ${name} must be set in production`);
  return devDefault;
}
const BRAIN_SVC_URL = requireUrl("BRAIN_SVC_URL", "http://localhost:3002");

async function fetchBrainContext(learnerId: string): Promise<NormalizedBrainContext> {
  return fetchNormalizedBrainContext(learnerId, { service: "learning-svc" });
}

function deriveFunctioningLevel(ctx: NormalizedBrainContext): string {
  return (
    ctx.functioningLevel ||
    ctx.functioning_level ||
    (ctx.functioningLevelProfile?.level as string | undefined) ||
    (ctx.functioning_level_profile?.level as string | undefined) ||
    "STANDARD"
  );
}

function deriveGradeBand(ctx: NormalizedBrainContext): string {
  const c = ctx.curriculumAlignment || ctx.curriculum_alignment || {};
  return (
    (c.grade_band as string | undefined) ||
    (c.gradeBand as string | undefined) ||
    (ctx.learner?.gradeLevel as string | undefined) ||
    "THIRD"
  );
}

function deriveDeliveryLevel(ctx: NormalizedBrainContext): string {
  const c = ctx.curriculumAlignment || ctx.curriculum_alignment || {};
  return (
    (c.delivery_level as string | undefined) ||
    (c.deliveryLevel as string | undefined) ||
    deriveGradeBand(ctx)
  );
}

export function registerSessionRoutes(app: FastifyInstance, db: any) {
  app.post("/api/learning/sessions", { schema: createSessionSchema }, async (request, reply) => {
    const body = request.body as {
      learnerId?: string;
      tutorSku?: string;
      topic?: string;
      contentType?: string;
      sessionDate?: string;
      durationMinutes?: number | string;
    };
    const { learnerId, tutorSku, topic, contentType } = body;
    if (!learnerId || !tutorSku) {
      return reply.code(400).send({ error: "learnerId and tutorSku required" });
    }

    const access = await requireLearnerAccess(request, reply, db, learnerId);
    if (!access) return;
    const tenantId = access.tenantId;

    // ---- Optional manual-entry fields (Phase 4 backend gap) -------------
    // The web therapist sessions page and mobile (therapist) sessions tab
    // collect a session date and a duration in minutes; honour them on the
    // initial insert so the row reflects when the documented session
    // actually happened, not when the therapist clicked "Log".
    let startedAt: Date | undefined;
    if (typeof body.sessionDate === "string" && body.sessionDate.trim()) {
      const parsed = new Date(body.sessionDate);
      if (!Number.isNaN(parsed.getTime())) startedAt = parsed;
    }
    let durationSeconds = 0;
    if (body.durationMinutes != null) {
      const minutes = typeof body.durationMinutes === "string"
        ? parseFloat(body.durationMinutes)
        : body.durationMinutes;
      if (Number.isFinite(minutes) && minutes > 0) {
        // Clamp to a reasonable cap (8 h) so a typo can't poison reports.
        durationSeconds = Math.round(Math.min(minutes, 480) * 60);
      }
    }

    // ---- Manual therapy-session log path (Phase 4 backend gap) ----------
    // The dashboards POST `contentType: "THERAPY_SESSION"` to record a
    // therapist-led session that already happened. That value is not in
    // the `content_type` enum, and there is no AI lesson to generate, so
    // short-circuit: store with the LESSON content-type, mark COMPLETED,
    // stash the original category and notes in `session_data`, and skip
    // the content-generation pipeline entirely.
    if (contentType === "THERAPY_SESSION") {
      // tutorSku follows the `therapy-${category}` convention agreed with
      // the web + mobile therapist sessions screens; strip the prefix to
      // recover the raw category (e.g. "speech", "occupational"). Falls
      // back to "therapy" if the client sent something off-pattern.
      const THERAPY_SKU_PREFIX = "therapy-";
      const subject = tutorSku.startsWith(THERAPY_SKU_PREFIX)
        ? tutorSku.slice(THERAPY_SKU_PREFIX.length)
        : "therapy";
      const sessionTimestamp = startedAt ?? new Date();
      const [session] = await db.insert(lessonSessions).values({
        tenantId,
        learnerId,
        tutorSku,
        subject,
        status: "COMPLETED",
        contentType: "LESSON",
        functioningLevel: null,
        sessionData: {
          manualLog: true,
          source: "therapy_session",
          category: subject,
          notes: typeof topic === "string" ? topic : null,
        },
        durationSeconds,
        startedAt: sessionTimestamp,
        completedAt: sessionTimestamp,
      }).returning();
      return { sessionId: session.id, status: "COMPLETED" };
    }

    const subject = getSubjectForTutor(tutorSku);
    const brainContext = await fetchBrainContext(learnerId);
    const functioningLevel = deriveFunctioningLevel(brainContext);
    const gradeBand = deriveGradeBand(brainContext);
    const deliveryLevel = deriveDeliveryLevel(brainContext);

    const [session] = await db.insert(lessonSessions).values({
      tenantId,
      learnerId,
      tutorSku,
      subject,
      status: "CONTENT_GENERATING",
      contentType: contentType || "LESSON",
      functioningLevel,
      brainContextSnapshot: brainContext,
      ...(startedAt ? { startedAt } : {}),
      ...(durationSeconds > 0 ? { durationSeconds } : {}),
    }).returning();

    try {
      const generated = await generateLessonContent({
        subject,
        topic: topic || `Introduction to ${subject}`,
        gradeTarget: gradeBand,
        deliveryLevel,
        functioningLevel,
        brainContext: brainContext as unknown as Record<string, unknown>,
        contentType: contentType || "LESSON",
      });

      await db.insert(lessonContent).values({
        sessionId: session.id,
        contentType: contentType || "LESSON",
        subject,
        topic: topic || `Introduction to ${subject}`,
        gradeTarget: gradeBand,
        deliveryLevel,
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

      // Best-effort StagePlan profile-evidence gate. Only runs when the
      // generated content can be parsed as a plan object — generic
      // markdown lessons skip this gate silently.
      let parsedPlan: unknown = null;
      try {
        parsedPlan = typeof generated.content === "string" ? JSON.parse(generated.content) : generated.content;
      } catch {
        parsedPlan = null;
      }
      if (parsedPlan && typeof parsedPlan === "object" && Array.isArray((parsedPlan as any).beats)) {
        const validation = validateStagePlan(parsedPlan, {
          functioningLevel,
          subject,
          topic: topic || undefined,
          brainHadAccommodations: brainContext.profileCompleteness.hasAccommodations,
          brainHadIep: brainContext.profileCompleteness.hasIep,
        });
        if (!validation.valid) {
          await db.update(lessonSessions)
            .set({ status: "ABANDONED", sessionData: { error: "StagePlan failed profile gate", validationIssues: validation.issues } })
            .where(eq(lessonSessions.id, session.id));
          return reply.code(422).send({
            error: "StagePlan failed profile gate",
            validationIssues: validation.issues,
          });
        }
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

  app.post("/api/learning/sessions/:sessionId/complete", { schema: completeSessionSchema }, async (request, reply) => {
    const { sessionId } = request.params as any;
    const body = (request.body as any) || {};
    const { masteryUpdates, xpEarned } = body;

    const [session] = await db.select().from(lessonSessions).where(eq(lessonSessions.id, sessionId));
    if (!session) return reply.code(404).send({ error: "Session not found" });

    const access = await requireLearnerAccess(request, reply, db, session.learnerId);
    if (!access) return;

    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    // Compute multi-signal XP + quality unless caller supplied a final xpEarned.
    const masteryBefore = (session.brainContextSnapshot as any)?.mastery_levels || {};
    const masteryDelta = computeMasteryDelta(masteryBefore, masteryUpdates || {});
    const signals: LessonSignals = {
      durationSeconds,
      functioningLevel: session.functioningLevel || "STANDARD",
      beatsCompleted: body.beatsCompleted,
      beatsTotal: body.beatsTotal,
      correctAnswers: body.correctAnswers,
      attemptedAnswers: body.attemptedAnswers,
      engagementBeats: body.engagementBeats,
      breaksUsed: body.breaksUsed,
      masteryDelta,
    };
    const computedXp = computeLessonXp(signals);
    const completionQuality = computeCompletionQuality(signals);
    const finalXp = typeof xpEarned === "number" ? xpEarned : computedXp;

    await db.update(lessonSessions).set({
      status: "COMPLETED",
      masteryAfter: masteryUpdates || {},
      xpEarned: finalXp,
      completedAt: new Date(),
      durationSeconds,
      sessionData: {
        ...((session.sessionData as any) || {}),
        completionQuality,
        scoringSignals: signals,
      },
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

    return { status: "COMPLETED", sessionId, xpEarned: finalXp, completionQuality };
  });

  app.post("/api/learning/gradebook/update", { schema: updateGradebookSchema }, async (request, reply) => {
    // Authentication is enforced by the global onRequest hook
    // (registerAuthHook): JWT or x-service-token. Authorization
    // (tenant match) is enforced per-call below via requireLearnerAccess.
    const { learnerId, skill, masteryScore, sessionType, xpEarned } = request.body as any;
    if (!learnerId || !skill) {
      return reply.code(400).send({ error: "learnerId and skill required" });
    }

    const access = await requireLearnerAccess(request, reply, db, learnerId);
    if (!access) return;
    const tenantId = access.tenantId;

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

  app.get("/api/learning/sessions", { schema: listSessionsSchema }, async (request, reply) => {
    const { learnerId } = request.query as any;
    if (!learnerId) return reply.code(400).send({ error: "learnerId required" });

    const access = await requireLearnerAccess(request, reply, db, learnerId);
    if (!access) return;

    const sessions = await db.select().from(lessonSessions)
      .where(eq(lessonSessions.learnerId, learnerId))
      .orderBy(desc(lessonSessions.startedAt))
      .limit(20);
    return sessions;
  });

  app.get("/api/learning/gradebook/:learnerId", { schema: getGradebookSchema }, async (request, reply) => {
    const { learnerId } = request.params as any;

    const access = await requireLearnerAccess(request, reply, db, learnerId);
    if (!access) return;

    const entries = await db.select().from(gradebookEntries)
      .where(eq(gradebookEntries.learnerId, learnerId))
      .orderBy(desc(gradebookEntries.updatedAt));
    return entries;
  });

  app.get("/api/learning/path/:learnerId/:subject", { schema: getLearningPathSchema }, async (request, reply) => {
    const { learnerId, subject } = request.params as any;

    const access = await requireLearnerAccess(request, reply, db, learnerId);
    if (!access) return;

    const [path] = await db.select().from(learningPaths)
      .where(and(eq(learningPaths.learnerId, learnerId), eq(learningPaths.subject, subject)));

    if (!path) {
      const [newPath] = await db.insert(learningPaths).values({
        tenantId: access.tenantId,
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

  app.post("/api/learning/path/:learnerId/:subject/init", { schema: initLearningPathSchema }, async (request, reply) => {
    const { learnerId, subject } = request.params as any;

    const access = await requireLearnerAccess(request, reply, db, learnerId);
    if (!access) return;

    const [existing] = await db.select().from(learningPaths)
      .where(and(eq(learningPaths.learnerId, learnerId), eq(learningPaths.subject, subject)));

    if (existing) {
      return { status: "already_exists", path: existing };
    }

    const tenantId = access.tenantId;

    // Insert with static defaults first so we always return something fast.
    const [newPath] = await db.insert(learningPaths).values({
      tenantId,
      learnerId,
      subject,
      topicSequence: getDefaultTopics(subject),
      completedTopics: [],
      masteryMap: {},
    }).returning();

    // Best-effort upgrade to personalized LLM-generated topics.
    const authHeader = request.headers.authorization;
    const personalized = await fetchPersonalizedTopics({
      learnerId,
      subject,
      currentMastery: 0,
      completedTopics: [],
      authHeader,
    });

    if (personalized) {
      const topicNames = personalized.map((t) => t.topic).filter(Boolean);
      if (topicNames.length > 0) {
        const [updated] = await db.update(learningPaths)
          .set({ topicSequence: topicNames, updatedAt: new Date() })
          .where(eq(learningPaths.id, newPath.id))
          .returning();
        return { status: "created", path: updated, personalized: true };
      }
    }

    return { status: "created", path: newPath, personalized: false };
  });

  app.post("/api/learning/path/:learnerId/:subject/refresh-topics", { schema: refreshLearningPathTopicsSchema }, async (request, reply) => {
    const { learnerId, subject } = request.params as any;

    const access = await requireLearnerAccess(request, reply, db, learnerId);
    if (!access) return;

    const [path] = await db.select().from(learningPaths)
      .where(and(eq(learningPaths.learnerId, learnerId), eq(learningPaths.subject, subject)));

    if (!path) {
      return reply.code(404).send({ error: "Learning path not found" });
    }

    const brain = await fetchBrainContext(learnerId);
    const masteryLevels = (brain.mastery_levels || {}) as Record<string, number>;
    const subjectScores = Object.entries(masteryLevels)
      .filter(([k]) => k.toLowerCase().includes(subject.toLowerCase().split(" ")[0]))
      .map(([, v]) => Number(v) || 0);
    const currentMastery = subjectScores.length
      ? subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length
      : 0;

    const completedTopics = ((path.completedTopics as string[]) || []).slice(-20);
    const personalized = await fetchPersonalizedTopics({
      learnerId,
      subject,
      currentMastery,
      completedTopics,
      authHeader: request.headers.authorization,
    });

    if (!personalized) {
      return reply.code(503).send({
        status: "fallback",
        error: "Could not refresh topics from curriculum engine",
        topicSequence: path.topicSequence,
      });
    }

    const topicNames = personalized.map((t) => t.topic).filter(Boolean);
    const [updated] = await db.update(learningPaths)
      .set({ topicSequence: topicNames, updatedAt: new Date() })
      .where(eq(learningPaths.id, path.id))
      .returning();

    return { status: "refreshed", path: updated, topicCount: topicNames.length };
  });

  app.post("/api/learning/path/:learnerId/:subject/advance", { schema: advanceLearningPathSchema }, async (request, reply) => {
    const { learnerId, subject } = request.params as any;

    const access = await requireLearnerAccess(request, reply, db, learnerId);
    if (!access) return;

    const [path] = await db.select().from(learningPaths)
      .where(and(eq(learningPaths.learnerId, learnerId), eq(learningPaths.subject, subject)));

    if (!path) {
      return reply.code(404).send({ error: "Learning path not found" });
    }

    const sequence = (path.topicSequence as string[]) || [];
    const completed = (path.completedTopics as string[]) || [];
    const currentTopic = sequence.find((t) => !completed.includes(t));

    if (!currentTopic) {
      return { status: "path_complete", subject, completedCount: completed.length };
    }

    const brain = await fetchBrainContext(learnerId);
    const functioningLevel = deriveFunctioningLevel(brain);
    const threshold = MASTERY_THRESHOLDS[functioningLevel] ?? MASTERY_THRESHOLDS.STANDARD;

    const gradebook = await db.select().from(gradebookEntries).where(
      and(eq(gradebookEntries.learnerId, learnerId), eq(gradebookEntries.skill, currentTopic)),
    );
    const masteryScore = Number(gradebook[0]?.masteryScore) || 0;

    if (masteryScore < threshold) {
      return {
        status: "needs_practice",
        currentTopic,
        masteryScore,
        thresholdRequired: threshold,
        functioningLevel,
      };
    }

    const newCompleted = [...completed, currentTopic];
    const remaining = sequence.filter((t) => !newCompleted.includes(t));
    const nextTopic = remaining[0] || null;

    await db.update(learningPaths)
      .set({ completedTopics: newCompleted, currentTopic: nextTopic, updatedAt: new Date() })
      .where(eq(learningPaths.id, path.id));

    // Trigger refresh once the queue is running low (fire-and-forget).
    if (remaining.length <= 3) {
      const authHeader = request.headers.authorization;
      void (async () => {
        try {
          const personalized = await fetchPersonalizedTopics({
            learnerId,
            subject,
            currentMastery: masteryScore,
            completedTopics: newCompleted.slice(-20),
            authHeader,
          });
          if (personalized) {
            const newTopics = personalized.map((t) => t.topic).filter(Boolean);
            const merged = Array.from(new Set([...remaining, ...newTopics]));
            await db.update(learningPaths)
              .set({ topicSequence: merged, updatedAt: new Date() })
              .where(eq(learningPaths.id, path.id));
          }
        } catch {}
      })();
    }

    return {
      status: nextTopic ? "advanced" : "path_complete",
      previousTopic: currentTopic,
      nextTopic,
      masteryScore,
      thresholdRequired: threshold,
      functioningLevel,
    };
  });
}

const MASTERY_THRESHOLDS: Record<string, number> = {
  STANDARD: 0.70,
  SUPPORTED: 0.60,
  LOW_VERBAL: 0.50,
  NON_VERBAL: 0.40,
  PRE_SYMBOLIC: 0.30,
};

function computeMasteryDelta(
  before: Record<string, number>,
  after: Record<string, number>,
): number {
  const keys = Object.keys(after);
  if (keys.length === 0) return 0;
  let total = 0;
  for (const k of keys) {
    total += (Number(after[k]) || 0) - (Number(before[k]) || 0);
  }
  return total / keys.length;
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
