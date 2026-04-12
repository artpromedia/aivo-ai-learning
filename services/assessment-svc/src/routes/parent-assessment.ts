import { FastifyInstance } from "fastify";
import { parentAssessments, learners, learnerFunctioningLevels } from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { eq } from "drizzle-orm";
import { determineFunctioningLevel } from "../services/level-router.js";

async function authenticate(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Unauthorized" });
  try { req.user = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }
}

export async function registerParentAssessmentRoutes(app: FastifyInstance) {
  app.post("/api/assessments/parent", {
    schema: {
      tags: ["Parent Assessment"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["learnerId", "communicationMode", "deviceInteraction", "responseMethod"],
        properties: {
          learnerId: { type: "string" },
          communicationMode: { type: "string", enum: ["verbal", "limited_verbal", "non_verbal", "pre_symbolic", "aac_device", "sign_language"] },
          deviceInteraction: { type: "string", enum: ["independent", "guided", "switch_access", "eye_gaze", "partner_assisted"] },
          responseMethod: { type: "string", enum: ["typing", "voice", "touch_select", "switch_scan", "partner_response"] },
          attentionSpan: { type: "string", enum: ["typical", "short", "very_short", "variable", "task_dependent"] },
          diagnoses: { type: "array", items: { type: "string" } },
          additionalResponses: { type: "object" },
        },
      },
    },
    preHandler: authenticate,
  }, async (req) => {
    const db = (app as any).db;
    const user = (req as any).user;
    const body = req.body as any;

    if (user.role !== "PARENT") throw { statusCode: 403, message: "Only parents can submit assessments" };

    const [assessment] = await db.insert(parentAssessments).values({
      tenantId: user.tenantId,
      learnerId: body.learnerId,
      communicationMode: body.communicationMode,
      deviceInteraction: body.deviceInteraction,
      responseMethod: body.responseMethod,
      attentionSpan: body.attentionSpan,
      diagnoses: body.diagnoses || [],
      responses: body.additionalResponses || {},
      completedAt: new Date(),
    }).returning();

    const level = determineFunctioningLevel({
      communicationMode: body.communicationMode,
      deviceInteraction: body.deviceInteraction,
      responseMethod: body.responseMethod,
      attentionSpan: body.attentionSpan,
    });

    await db.update(learners)
      .set({ functioningLevel: level.level, communicationMode: body.communicationMode })
      .where(eq(learners.id, body.learnerId));

    await db.insert(learnerFunctioningLevels).values({
      learnerId: body.learnerId,
      level: level.level,
      determinedBy: "parent_assessment",
      parentSignals: {
        communicationMode: body.communicationMode,
        deviceInteraction: body.deviceInteraction,
        responseMethod: body.responseMethod,
      },
      confidence: level.confidence,
    });

    return {
      assessment,
      functioningLevel: level,
    };
  });
}
