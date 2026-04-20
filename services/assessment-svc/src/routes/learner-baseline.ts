import { FastifyInstance } from "fastify";
import { parentAssessments, learners, assessmentAttempts } from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { eq, desc } from "drizzle-orm";

async function authenticate(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Unauthorized" });
  try { req.user = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }
}

const AI_SVC_URL = process.env.AI_SVC_URL || "http://localhost:3004";
const BRAIN_SVC_URL = process.env.BRAIN_SVC_URL || "http://localhost:3002";

function buildParentAssessmentPayload(parentAssessment: any, learner: any) {
  return {
    communicationMode: parentAssessment.communicationMode,
    deviceInteraction: parentAssessment.deviceInteraction,
    responseMethod: parentAssessment.responseMethod,
    attentionSpan: parentAssessment.attentionSpan,
    diagnoses: parentAssessment.diagnoses,
    responses: parentAssessment.responses,
    functioningLevel: learner.functioningLevel || "STANDARD",
  };
}

export async function registerLearnerBaselineRoutes(app: FastifyInstance) {

  app.get("/api/assessments/learner/discovery/:learnerId/status", {
    schema: {
      tags: ["Discovery Adventure"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["learnerId"],
        properties: { learnerId: { type: "string" } },
      },
    },
    preHandler: authenticate,
  }, async (req, reply) => {
    const db = (app as any).db;
    const user = (req as any).user;
    const { learnerId } = req.params as { learnerId: string };

    let [learner] = await db.select().from(learners).where(eq(learners.id, learnerId)).limit(1);
    if (!learner) {
      [learner] = await db.select().from(learners).where(eq(learners.userId, learnerId)).limit(1);
    }
    if (!learner) return reply.status(404).send({ error: "Learner not found" });

    if (user.role === "LEARNER" && user.sub !== learner.userId) {
      return reply.status(403).send({ error: "Access denied" });
    }
    if (user.role === "PARENT" && learner.parentId !== user.sub) {
      return reply.status(403).send({ error: "Access denied" });
    }

    const [attempt] = await db
      .select()
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.learnerId, learner.id))
      .orderBy(desc(assessmentAttempts.createdAt))
      .limit(1);

    const completed = attempt?.status === "COMPLETED" && attempt?.type === "discovery_adventure";

    const [parentAss] = await db
      .select()
      .from(parentAssessments)
      .where(eq(parentAssessments.learnerId, learner.id))
      .orderBy(desc(parentAssessments.createdAt))
      .limit(1);

    let approvalStatus: string | null = null;
    try {
      const brainRes = await fetch(`${BRAIN_SVC_URL}/api/brain/${learner.id}`, {
        headers: { Authorization: req.headers.authorization as string },
      });
      if (brainRes.ok) {
        const brainData = await brainRes.json() as { approval_status?: string };
        approvalStatus = brainData.approval_status || null;
      }
    } catch {}

    return reply.send({
      learnerId: learner.id,
      baselineCompleted: completed,
      parentAssessmentCompleted: !!parentAss?.completedAt,
      assessmentId: attempt?.id || null,
      approvalStatus,
    });
  });

  app.post("/api/assessments/learner/discovery/:learnerId/chapter", {
    schema: {
      tags: ["Discovery Adventure"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["learnerId"],
        properties: { learnerId: { type: "string" } },
      },
      body: {
        type: "object",
        required: ["chapter"],
        properties: {
          chapter: { type: "object" },
        },
      },
    },
    preHandler: authenticate,
  }, async (req, reply) => {
    const db = (app as any).db;
    const user = (req as any).user;
    const { learnerId } = req.params as { learnerId: string };
    const { chapter } = req.body as { chapter: any };

    let [learner] = await db.select().from(learners).where(eq(learners.id, learnerId)).limit(1);
    if (!learner) {
      [learner] = await db.select().from(learners).where(eq(learners.userId, learnerId)).limit(1);
    }
    if (!learner) return reply.status(404).send({ error: "Learner not found" });

    if (user.role === "LEARNER" && user.sub !== learner.userId) {
      return reply.status(403).send({ error: "Access denied" });
    }
    if (user.role === "PARENT" && learner.parentId !== user.sub) {
      return reply.status(403).send({ error: "Access denied" });
    }

    const [parentAssessment] = await db
      .select()
      .from(parentAssessments)
      .where(eq(parentAssessments.learnerId, learner.id))
      .orderBy(desc(parentAssessments.createdAt))
      .limit(1);

    if (!parentAssessment?.completedAt) {
      return reply.status(403).send({
        error: "parent_assessment_required",
        message: "Parent assessment must be completed before baseline assessment can begin",
      });
    }

    const parentPayload = buildParentAssessmentPayload(parentAssessment, learner);

    try {
      const aiRes = await fetch(`${AI_SVC_URL}/api/ai/generate-discovery-chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_assessment: parentPayload,
          chapter,
          functioning_level: learner.functioningLevel || "STANDARD",
        }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.text();
        return reply.status(502).send({ error: "AI generation failed", detail: err });
      }

      const data = await aiRes.json() as any;
      return reply.send({
        generated: true,
        learnerId,
        functioningLevel: learner.functioningLevel,
        chapterId: data.chapter_id,
        activities: data.activities,
        model: data.model,
      });
    } catch (e: any) {
      return reply.status(502).send({ error: "Failed to reach AI service", detail: e.message });
    }
  });

  app.post("/api/assessments/learner/discovery/:learnerId/complete", {
    schema: {
      tags: ["Discovery Adventure"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["learnerId"],
        properties: { learnerId: { type: "string" } },
      },
      body: {
        type: "object",
        required: ["chapterResults", "totalCorrect", "totalAttempts"],
        properties: {
          chapterResults: { type: "array" },
          totalCorrect: { type: "number" },
          totalAttempts: { type: "number" },
          xpEarned: { type: "number" },
          responseLatencies: { type: "array" },
        },
      },
    },
    preHandler: authenticate,
  }, async (req, reply) => {
    const db = (app as any).db;
    const user = (req as any).user;
    const { learnerId } = req.params as { learnerId: string };
    const body = req.body as any;

    try {
      app.log.info({ learnerId, userSub: user?.sub, userRole: user?.role, totalCorrect: body?.totalCorrect, totalAttempts: body?.totalAttempts, chapterCount: (body?.chapterResults || []).length }, "[discovery/complete] received");

      let [learner] = await db.select().from(learners).where(eq(learners.id, learnerId)).limit(1);
      if (!learner) {
        [learner] = await db.select().from(learners).where(eq(learners.userId, learnerId)).limit(1);
      }
      if (!learner) {
        app.log.warn({ learnerId }, "[discovery/complete] learner not found");
        return reply.status(404).send({ error: "Learner not found" });
      }

      if (user.role === "LEARNER" && user.sub !== learner.userId) {
        app.log.warn({ learnerId, userSub: user.sub, learnerUserId: learner.userId }, "[discovery/complete] LEARNER access denied");
        return reply.status(403).send({ error: "Access denied" });
      }
      if (user.role === "PARENT" && learner.parentId !== user.sub) {
        app.log.warn({ learnerId, userSub: user.sub, learnerParentId: learner.parentId }, "[discovery/complete] PARENT access denied");
        return reply.status(403).send({ error: "Access denied" });
      }

      const [parentCheck] = await db
        .select()
        .from(parentAssessments)
        .where(eq(parentAssessments.learnerId, learner.id))
        .orderBy(desc(parentAssessments.createdAt))
        .limit(1);

      if (!parentCheck?.completedAt) {
        app.log.warn({ learnerId, hasParentRow: !!parentCheck }, "[discovery/complete] parent assessment not completed");
        return reply.status(403).send({
          error: "parent_assessment_required",
          message: "Parent assessment must be completed before baseline assessment can be completed",
        });
      }

      const [attempt] = await db.insert(assessmentAttempts).values({
        tenantId: learner.tenantId,
        learnerId: learner.id,
        type: "discovery_adventure",
        mode: "STANDARD",
        status: "COMPLETED",
        startedAt: new Date(),
        completedAt: new Date(),
        domainScores: Object.fromEntries(
          (body.chapterResults || []).map((ch: any) => [
            ch.domain,
            { correct: ch.correct, total: ch.total, difficulty: ch.difficulty, avgLatencyMs: ch.avgLatencyMs },
          ])
        ),
        metadata: {
          totalCorrect: body.totalCorrect,
          totalAttempts: body.totalAttempts,
          xpEarned: body.xpEarned || 0,
          chapterResults: body.chapterResults,
        },
      }).returning();

      app.log.info({ learnerId, attemptId: attempt.id }, "[discovery/complete] attempt inserted");

      let brainCloneStatus: string = "pending";
      let brainCloneError: string | null = null;
      let brainStateId: string | null = null;
      try {
        const cloneRes = await fetch(`${BRAIN_SVC_URL}/api/brain/clone`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization as string,
          },
          body: JSON.stringify({
            learner_id: learner.id,
            tenant_id: learner.tenantId,
            assessment_id: attempt.id,
            functioning_level: learner.functioningLevel || "STANDARD",
            discovery_results: {
              chapterResults: body.chapterResults || [],
              totalCorrect: body.totalCorrect || 0,
              totalAttempts: body.totalAttempts || 0,
              xpEarned: body.xpEarned || 0,
              responseLatencies: body.responseLatencies || [],
            },
          }),
        });

        if (cloneRes.ok) {
          const cloneData = await cloneRes.json() as any;
          brainCloneStatus = cloneData?.approval_status || cloneData?.approvalStatus || "cloned";
          brainStateId = cloneData?.brain_state_id || cloneData?.id || null;
          app.log.info({ learnerId, attemptId: attempt.id, brainStateId, brainCloneStatus }, "[discovery/complete] brain clone succeeded");
        } else {
          brainCloneError = await cloneRes.text();
          brainCloneStatus = "failed";
          app.log.error({ learnerId, attemptId: attempt.id, status: cloneRes.status, brainCloneError }, "[discovery/complete] brain clone failed");
        }
      } catch (cloneErr: any) {
        brainCloneError = cloneErr?.message || String(cloneErr);
        brainCloneStatus = "failed";
        app.log.error({ learnerId, attemptId: attempt.id, err: brainCloneError }, "[discovery/complete] brain clone request error");
      }

      return reply.send({
        success: true,
        assessmentId: attempt.id,
        learnerId,
        functioningLevel: learner.functioningLevel,
        domainScores: attempt.domainScores,
        brainCloneStatus,
        brainStateId,
        brainCloneError,
      });
    } catch (err: any) {
      app.log.error({ err: err?.message, stack: err?.stack, learnerId }, "[discovery/complete] FAILED");
      return reply.status(500).send({ error: "internal_error", detail: err?.message || String(err) });
    }
  });

  app.get("/api/assessments/learner/baseline/:learnerId", {
    schema: {
      tags: ["Learner Baseline"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["learnerId"],
        properties: { learnerId: { type: "string" } },
      },
    },
    preHandler: authenticate,
  }, async (req, reply) => {
    const db = (app as any).db;
    const user = (req as any).user;
    const { learnerId } = req.params as { learnerId: string };

    const [learner] = await db.select().from(learners).where(eq(learners.id, learnerId)).limit(1);
    if (!learner) return reply.status(404).send({ error: "Learner not found" });

    if (user.role === "LEARNER" && user.sub !== learnerId) {
      return reply.status(403).send({ error: "Access denied" });
    }
    if (user.role === "PARENT" && learner.parentId !== user.sub) {
      return reply.status(403).send({ error: "Access denied" });
    }

    const [parentAssessment] = await db
      .select()
      .from(parentAssessments)
      .where(eq(parentAssessments.learnerId, learnerId))
      .orderBy(desc(parentAssessments.createdAt))
      .limit(1);

    if (!parentAssessment) {
      return reply.send({
        generated: false,
        message: "No parent assessment found. Using default questions.",
        questions: null,
        subjects: null,
      });
    }

    try {
      const aiRes = await fetch(`${AI_SVC_URL}/api/ai/generate-baseline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_assessment: {
            communicationMode: parentAssessment.communicationMode,
            deviceInteraction: parentAssessment.deviceInteraction,
            responseMethod: parentAssessment.responseMethod,
            attentionSpan: parentAssessment.attentionSpan,
            diagnoses: parentAssessment.diagnoses,
            responses: parentAssessment.responses,
            functioningLevel: learner.functioningLevel || "STANDARD",
          },
          functioning_level: learner.functioningLevel || "STANDARD",
        }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.text();
        return reply.status(502).send({ error: "AI generation failed", detail: err });
      }

      const data = await aiRes.json() as any;
      return reply.send({
        generated: true,
        learnerId,
        functioningLevel: learner.functioningLevel,
        questions: data.questions,
        subjects: data.subjects,
        model: data.model,
      });
    } catch (e: any) {
      return reply.status(502).send({ error: "Failed to reach AI service", detail: e.message });
    }
  });
}
