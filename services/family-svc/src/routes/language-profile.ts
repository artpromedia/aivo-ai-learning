import { FastifyInstance } from "fastify";
import { authenticateRequest, verifyParentOwnership } from "../auth.js";
import { languageProfiles } from "@aivo/db";
import { eq } from "drizzle-orm";

export async function registerLanguageProfileRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.post("/api/family/language-profile/:learnerId", async (req, reply) => {
    const claims = await authenticateRequest(req, reply);
    if (!claims) return;

    const { learnerId } = req.params as any;
    const isOwner = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isOwner && claims.role !== "admin") {
      return reply.status(403).send({ error: "Not authorized for this learner" });
    }

    const body = req.body as any;
    if (!body.primaryLanguage) return reply.status(400).send({ error: "primaryLanguage required" });

    const existing = await db.select().from(languageProfiles).where(eq(languageProfiles.learnerId, learnerId)).limit(1);

    if (existing.length > 0) {
      await db.update(languageProfiles)
        .set({
          primaryLanguage: body.primaryLanguage,
          secondaryLanguages: body.secondaryLanguages || [],
          dominanceByDomain: body.dominanceByDomain || {},
          processingSpeed: body.processingSpeed || {},
          codeSwitchingFrequency: body.codeSwitchingFrequency || null,
          preferredInstructionLanguage: body.preferredInstructionLanguage || null,
          updatedAt: new Date(),
        })
        .where(eq(languageProfiles.learnerId, learnerId));
      return { status: "updated", learnerId };
    }

    const [profile] = await db.insert(languageProfiles).values({
      learnerId,
      primaryLanguage: body.primaryLanguage,
      secondaryLanguages: body.secondaryLanguages || [],
      dominanceByDomain: body.dominanceByDomain || {},
      processingSpeed: body.processingSpeed || {},
      codeSwitchingFrequency: body.codeSwitchingFrequency || null,
      preferredInstructionLanguage: body.preferredInstructionLanguage || null,
    }).returning();

    return { status: "created", profile };
  });

  app.get("/api/family/language-profile/:learnerId", async (req, reply) => {
    const claims = await authenticateRequest(req, reply);
    if (!claims) return;

    const { learnerId } = req.params as any;
    const isOwner = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isOwner && claims.role !== "admin") {
      return reply.status(403).send({ error: "Not authorized for this learner" });
    }

    const [profile] = await db.select().from(languageProfiles).where(eq(languageProfiles.learnerId, learnerId)).limit(1);
    if (!profile) return reply.status(404).send({ error: "Language profile not found" });
    return profile;
  });
}
