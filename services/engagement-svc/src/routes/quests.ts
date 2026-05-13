import { FastifyInstance } from "fastify";
import { eq, and, asc, sql } from "drizzle-orm";
import {
  quests,
  questProgress,
  xpEvents,
  virtualCurrency,
  currencyTransactions,
} from "@aivo/db";
import { authenticateRequest } from "../auth.js";
import { QUEST_WORLDS, resolveQuestWorld } from "../quest-worlds.js";
import {
  getQuestsWorldsSchema,
  getQuestsWorldBySlugSchema,
  getQuestsByWorldKeySchema,
  getQuestsChapterByQuestIdSchema,
  getQuestsProgressByLearnerIdSchema,
  questsStartSchema,
  questsCompleteSchema,
} from "./schemas.js";

export function registerQuestRoutes(
  app: FastifyInstance,
  db: ReturnType<typeof import("@aivo/db").createDb>
) {
  app.get("/api/engagement/quests/worlds", { schema: getQuestsWorldsSchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;
    return QUEST_WORLDS;
  });

  app.get(
    "/api/engagement/quests/worlds/:slug",
    { schema: getQuestsWorldBySlugSchema },
    async (request, reply) => {
      const claims = await authenticateRequest(request, reply);
      if (!claims) return;

      const { slug } = request.params as { slug: string };
      const world = resolveQuestWorld(slug);
      if (!world) {
        return reply.status(404).send({ error: "quest_world_not_found", slug });
      }
      return world;
    },
  );

  app.get(
    "/api/engagement/quests/chapter/:questId",
    { schema: getQuestsChapterByQuestIdSchema },
    async (request, reply) => {
      const claims = await authenticateRequest(request, reply);
      if (!claims) return;

      const { questId } = request.params as { questId: string };
      const [quest] = await db.select().from(quests).where(eq(quests.id, questId));
      if (!quest) {
        return reply.status(404).send({ error: "quest_not_found", questId });
      }
      const world = resolveQuestWorld(quest.worldKey);
      return { quest, world };
    },
  );

  app.get(
    "/api/engagement/quests/progress/:learnerId",
    { schema: getQuestsProgressByLearnerIdSchema },
    async (request, reply) => {
      const claims = await authenticateRequest(request, reply);
      if (!claims) return;

      const { learnerId } = request.params as { learnerId: string };
      const progress = await db
        .select()
        .from(questProgress)
        .where(eq(questProgress.learnerId, learnerId));

      return progress;
    },
  );

  app.post("/api/engagement/quests/start", { schema: questsStartSchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId, questId } = request.body as { learnerId: string; questId: string };
    if (!learnerId || !questId) {
      return reply.status(400).send({ error: "learnerId and questId required" });
    }

    const [quest] = await db.select().from(quests).where(eq(quests.id, questId));
    if (!quest) {
      return reply.status(404).send({ error: "quest_not_found", questId });
    }

    const [existing] = await db
      .select()
      .from(questProgress)
      .where(and(eq(questProgress.learnerId, learnerId), eq(questProgress.questId, questId)));

    if (existing) {
      // Re-entering an in-progress quest is allowed and idempotent;
      // re-entering a completed quest just returns the completion row so
      // the client can route to the world detail without an error.
      return { progress: existing, quest };
    }

    const [progress] = await db
      .insert(questProgress)
      .values({ learnerId, questId, status: "IN_PROGRESS" })
      .returning();

    return { progress, quest };
  });

  app.post("/api/engagement/quests/complete", { schema: questsCompleteSchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId, questId, score } = request.body as {
      learnerId: string;
      questId: string;
      score: number;
    };

    if (!learnerId || !questId) {
      return reply.status(400).send({ error: "learnerId and questId required" });
    }
    if (typeof score !== "number" || score < 0 || score > 100) {
      return reply.status(400).send({ error: "score must be 0-100" });
    }

    const [quest] = await db.select().from(quests).where(eq(quests.id, questId));
    if (!quest) {
      return reply.status(404).send({ error: "quest_not_found", questId });
    }

    const [existing] = await db
      .select()
      .from(questProgress)
      .where(and(eq(questProgress.learnerId, learnerId), eq(questProgress.questId, questId)));

    if (!existing) {
      return reply.status(400).send({ error: "quest_not_started" });
    }

    // Idempotent: if already completed, return the existing record without
    // double-awarding XP/coins.
    if (existing.status === "COMPLETED") {
      return {
        completed: true,
        score: existing.score ?? score,
        xpAwarded: 0,
        coinAwarded: 0,
        alreadyCompleted: true,
      };
    }

    await db
      .update(questProgress)
      .set({
        status: "COMPLETED",
        score,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(questProgress.learnerId, learnerId), eq(questProgress.questId, questId)));

    const xpAmount = quest.xpReward ?? 50;
    const coinAmount = quest.coinReward ?? 10;
    const tenantId = claims.tenantId || claims.sub;

    await db.insert(xpEvents).values({
      tenantId,
      learnerId,
      eventType: "quest_completed",
      xpAmount,
      metadata: { questId, worldKey: quest.worldKey, chapterNumber: quest.chapterNumber, score },
    });

    if (coinAmount > 0) {
      const [wallet] = await db
        .select()
        .from(virtualCurrency)
        .where(eq(virtualCurrency.learnerId, learnerId));
      if (wallet) {
        await db
          .update(virtualCurrency)
          .set({
            coins: sql`${virtualCurrency.coins} + ${coinAmount}`,
            totalCoinsEarned: sql`${virtualCurrency.totalCoinsEarned} + ${coinAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(virtualCurrency.learnerId, learnerId));
      } else {
        await db.insert(virtualCurrency).values({
          learnerId,
          coins: coinAmount,
          totalCoinsEarned: coinAmount,
        });
      }
      await db.insert(currencyTransactions).values({
        learnerId,
        currencyType: "coins",
        amount: coinAmount,
        reason: "quest_completed",
        referenceId: questId,
      });
    }

    return {
      completed: true,
      score,
      xpAwarded: xpAmount,
      coinAwarded: coinAmount,
      alreadyCompleted: false,
    };
  });
}
