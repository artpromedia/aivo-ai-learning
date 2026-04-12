import { FastifyInstance } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import {
  brainRecommendations,
  brainInsights,
} from "@aivo/db";
import { authenticateRequest, verifyParentOwnership } from "../auth.js";

interface LearnerId {
  learnerId: string;
}

interface RespondParams extends LearnerId {
  recId: string;
}

interface RespondBody {
  action: string;
  notes?: string;
}

interface QueryStatus {
  status?: string;
}

export async function registerRecommendationRoutes(app: FastifyInstance) {
  const db = (app as unknown as { db: ReturnType<typeof import("@aivo/db").createDb> }).db;

  app.get("/api/family/recommendations/:learnerId", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as LearnerId;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    const { status } = request.query as QueryStatus;

    const allRecs = await db.select().from(brainRecommendations)
      .where(eq(brainRecommendations.learnerId, learnerId))
      .orderBy(desc(brainRecommendations.createdAt));

    if (status) {
      return allRecs.filter((r) => r.status === status);
    }

    return allRecs;
  });

  app.post("/api/family/recommendations/:learnerId/:recId/respond", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId, recId } = request.params as RespondParams;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent) return reply.code(403).send({ error: "Only parents can respond to recommendations" });

    const body = request.body as RespondBody;
    if (!["APPROVED", "DECLINED", "ADJUSTED"].includes(body.action)) {
      return reply.code(400).send({ error: "action must be APPROVED, DECLINED, or ADJUSTED" });
    }

    const existing = await db.select().from(brainRecommendations).where(
      and(eq(brainRecommendations.id, recId), eq(brainRecommendations.learnerId, learnerId))
    );
    if (existing.length === 0) return reply.code(404).send({ error: "Recommendation not found" });

    await db.update(brainRecommendations).set({
      status: body.action as "APPROVED" | "DECLINED" | "ADJUSTED",
      parentNotes: body.notes || null,
      resolvedAt: new Date(),
    }).where(eq(brainRecommendations.id, recId));

    return { status: "updated", action: body.action };
  });

  app.get("/api/family/recommendations/:learnerId/history", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as LearnerId;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    const allRecs = await db.select().from(brainRecommendations).where(
      eq(brainRecommendations.learnerId, learnerId)
    ).orderBy(desc(brainRecommendations.createdAt));

    const pending = allRecs.filter((r) => r.status === "PENDING");
    const acted = allRecs.filter((r) => r.status !== "PENDING");

    return { pending, acted, total: allRecs.length };
  });

  app.get("/api/family/recommendations/:learnerId/conflicts", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as LearnerId;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    const pendingRecs = await db.select().from(brainRecommendations).where(
      and(eq(brainRecommendations.learnerId, learnerId), eq(brainRecommendations.status, "PENDING"))
    );

    const domainGroups: Record<string, typeof pendingRecs> = {};
    for (const rec of pendingRecs) {
      const payload = rec.payload as Record<string, string> | null;
      const domain = payload?.domain || rec.type || "general";
      if (!domainGroups[domain]) domainGroups[domain] = [];
      domainGroups[domain].push(rec);
    }

    const recConflicts = Object.entries(domainGroups)
      .filter(([, recs]) => recs.length > 1)
      .map(([domain, recs]) => ({
        type: "recommendation_overlap" as const,
        domain,
        items: recs,
        description: `Multiple pending recommendations for ${domain} — review to resolve`,
      }));

    const insights = await db.select().from(brainInsights)
      .where(eq(brainInsights.learnerId, learnerId))
      .orderBy(desc(brainInsights.createdAt));

    const insightConflicts: Array<{
      type: "insight_disagreement";
      domain: string;
      items: Array<{ source: string; sourceUserId: string | null; insightText: string; createdAt: Date }>;
      description: string;
    }> = [];

    const insightsByDomain: Record<string, typeof insights> = {};
    for (const insight of insights) {
      const domain = insight.domain || "general";
      if (!insightsByDomain[domain]) insightsByDomain[domain] = [];
      insightsByDomain[domain].push(insight);
    }

    for (const [domain, domainInsights] of Object.entries(insightsByDomain)) {
      const sources = new Set(domainInsights.map(i => i.source));
      const hasParent = sources.has("parent");
      const hasTeacher = sources.has("teacher");
      const hasTherapist = sources.has("therapist");
      const hasCareGiver = sources.has("caregiver");

      if ((hasParent && hasTeacher) || (hasParent && hasTherapist) || (hasTeacher && hasCareGiver)) {
        const recentInsights = domainInsights.slice(0, 5);
        const contributingSources = Array.from(sources).join(", ");
        insightConflicts.push({
          type: "insight_disagreement",
          domain,
          items: recentInsights.map(i => ({
            source: i.source,
            sourceUserId: i.sourceUserId,
            insightText: i.insightText,
            createdAt: i.createdAt,
          })),
          description: `Multiple perspectives from ${contributingSources} in ${domain} — review for potential disagreements`,
        });
      }
    }

    const allConflicts = [...recConflicts, ...insightConflicts];

    return { conflicts: allConflicts, count: allConflicts.length };
  });
}
