import { FastifyInstance } from "fastify";
import { parentAssessments, learners } from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { eq, desc } from "drizzle-orm";

async function authenticate(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Unauthorized" });
  try { req.user = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }
}

const AI_SVC_URL = process.env.AI_SVC_URL || "http://localhost:3004";

export async function registerLearnerBaselineRoutes(app: FastifyInstance) {
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

      const data = await aiRes.json();
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
