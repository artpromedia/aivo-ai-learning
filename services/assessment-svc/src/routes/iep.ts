import { FastifyInstance } from "fastify";
import { iepDocuments, iepProfiles, iepGoals, learners, learnerFunctioningLevels } from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { eq } from "drizzle-orm";

async function authenticate(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Unauthorized" });
  try { req.user = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }
}

export async function registerIepRoutes(app: FastifyInstance) {
  app.post("/api/iep/upload", {
    schema: {
      tags: ["IEP"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["learnerId", "fileName"],
        properties: {
          learnerId: { type: "string" },
          fileName: { type: "string" },
          fileUrl: { type: "string" },
          parsedData: { type: "object" },
        },
      },
    },
    preHandler: authenticate,
  }, async (req) => {
    const db = (app as any).db;
    const body = req.body as any;

    const [doc] = await db.insert(iepDocuments).values({
      learnerId: body.learnerId,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      parsedData: body.parsedData,
      status: body.parsedData ? "parsed" : "uploaded",
    }).returning();

    if (body.parsedData) {
      const parsed = body.parsedData;
      const [profile] = await db.insert(iepProfiles).values({
        learnerId: body.learnerId,
        disabilityCategories: parsed.disabilityCategories || [],
        accommodations: parsed.accommodations || [],
        goals: parsed.goals || [],
        gradeLevel: parsed.gradeLevel,
        communicationSystem: parsed.communicationSystem,
        assistiveTechnology: parsed.assistiveTechnology || [],
        recommendedFunctioningLevel: parsed.recommendedFunctioningLevel,
      }).returning();

      if (parsed.goals?.length) {
        for (const goal of parsed.goals) {
          await db.insert(iepGoals).values({
            learnerId: body.learnerId,
            iepProfileId: profile.id,
            goalText: goal.text || goal,
            domain: goal.domain,
            baseline: goal.baseline,
            targetCriteria: goal.targetCriteria,
          });
        }
      }

      if (parsed.recommendedFunctioningLevel) {
        await db.update(learners)
          .set({ functioningLevel: parsed.recommendedFunctioningLevel })
          .where(eq(learners.id, body.learnerId));

        await db.insert(learnerFunctioningLevels).values({
          learnerId: body.learnerId,
          level: parsed.recommendedFunctioningLevel,
          determinedBy: "iep_parse",
          iepSignals: {
            disabilityCategories: parsed.disabilityCategories,
            communicationSystem: parsed.communicationSystem,
            accommodations: parsed.accommodations,
          },
          confidence: 90,
        });
      }

      return { document: doc, profile };
    }

    return { document: doc };
  });

  app.post("/api/iep/parse", {
    schema: {
      tags: ["IEP"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["learnerId", "documentText"],
        properties: {
          learnerId: { type: "string" },
          documentText: { type: "string" },
          fileName: { type: "string" },
        },
      },
    },
    preHandler: authenticate,
  }, async (req) => {
    const db = (app as any).db;
    const body = req.body as { learnerId: string; documentText: string; fileName?: string };

    const AI_SVC_URL = process.env.AI_SVC_URL || "http://localhost:3004";

    let parsedData: any;
    try {
      const aiRes = await fetch(`${AI_SVC_URL}/api/ai/parse-iep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_text: body.documentText, learner_name: "" }),
      });
      if (aiRes.ok) {
        parsedData = await aiRes.json();
      }
    } catch {
      /* AI parsing failed, continue with manual storage */
    }

    const [doc] = await db.insert(iepDocuments).values({
      learnerId: body.learnerId,
      fileName: body.fileName || "pasted-iep-text",
      parsedData: parsedData || { raw_text: body.documentText.substring(0, 5000) },
      status: parsedData ? "parsed" : "uploaded",
    }).returning();

    if (parsedData) {
      const goals = (parsedData.goals || []).map((g: any) => ({
        text: g.description || g.text || "",
        domain: g.domain || "other",
        baseline: g.baseline || "",
        targetCriteria: g.measurable_criteria || g.target || "",
      }));

      const [profile] = await db.insert(iepProfiles).values({
        learnerId: body.learnerId,
        disabilityCategories: parsedData.disability_categories || [],
        accommodations: parsedData.accommodations || [],
        goals,
        recommendedFunctioningLevel: parsedData.recommended_functioning_level,
      }).returning();

      for (const goal of goals) {
        await db.insert(iepGoals).values({
          learnerId: body.learnerId,
          iepProfileId: profile.id,
          goalText: goal.text,
          domain: goal.domain,
          baseline: goal.baseline,
          targetCriteria: goal.targetCriteria,
        });
      }

      if (parsedData.recommended_functioning_level) {
        await db.update(learners)
          .set({ functioningLevel: parsedData.recommended_functioning_level })
          .where(eq(learners.id, body.learnerId));

        await db.insert(learnerFunctioningLevels).values({
          learnerId: body.learnerId,
          level: parsedData.recommended_functioning_level,
          determinedBy: "ai_iep_parse",
          iepSignals: {
            disabilityCategories: parsedData.disability_categories,
            accommodations: parsedData.accommodations,
            model: parsedData.model,
          },
          confidence: 85,
        });
      }

      return { document: doc, profile, parsed: true, summary: parsedData.summary };
    }

    return { document: doc, parsed: false };
  });

  app.get("/api/iep/learner/:learnerId", {
    schema: { tags: ["IEP"], security: [{ bearerAuth: [] }] },
    preHandler: authenticate,
  }, async (req) => {
    const db = (app as any).db;
    const { learnerId } = req.params as any;

    const profiles = await db.select().from(iepProfiles)
      .where(eq(iepProfiles.learnerId, learnerId));
    const goals = await db.select().from(iepGoals)
      .where(eq(iepGoals.learnerId, learnerId));
    const documents = await db.select().from(iepDocuments)
      .where(eq(iepDocuments.learnerId, learnerId));

    return { profiles, goals, documents };
  });
}
