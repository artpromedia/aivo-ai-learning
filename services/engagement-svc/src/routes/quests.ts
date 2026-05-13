import { FastifyInstance } from "fastify";
import { eq, and, asc } from "drizzle-orm";
import { quests, questProgress } from "@aivo/db";
import { authenticateRequest } from "../auth.js";
import { QUEST_WORLDS, resolveQuestWorld } from "../quest-worlds.js";
import {
  getQuestsWorldsSchema,
  getQuestsWorldBySlugSchema,
  getQuestsByWorldKeySchema,
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

  app.get("/api/engagement/quests/:worldKey", { schema: getQuestsByWorldKeySchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { worldKey } = request.params as { worldKey: string };
    const world = resolveQuestWorld(worldKey);
    if (!world) {
      return reply.status(404).send({ error: "quest_world_not_found", slug: worldKey });
    }

    const worldQuests = await db
      .select()
      .from(quests)
      .where(eq(quests.worldKey, world.key))
      .orderBy(asc(quests.chapterNumber));

    return { world, quests: worldQuests };
  });

  app.get("/api/engagement/quests/progress/:learnerId", { schema: getQuestsProgressByLearnerIdSchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as { learnerId: string };
    const progress = await db
      .select()
      .from(questProgress)
      .where(eq(questProgress.learnerId, learnerId));

    return progress;
  });

  app.post("/api/engagement/quests/start", { schema: questsStartSchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId, questId } = request.body as { learnerId: string; questId: string };

    const [existing] = await db
      .select()
      .from(questProgress)
      .where(and(eq(questProgress.learnerId, learnerId), eq(questProgress.questId, questId)));

    if (existing) {
      if (existing.status === "COMPLETED") {
        return reply.status(400).send({ error: "Quest already completed" });
      }
      return { progress: existing };
    }

    const [progress] = await db
      .insert(questProgress)
      .values({ learnerId, questId, status: "IN_PROGRESS" })
      .returning();

    return { progress };
  });

  app.post("/api/engagement/quests/complete", { schema: questsCompleteSchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId, questId, score } = request.body as {
      learnerId: string;
      questId: string;
      score: number;
    };

    await db
      .update(questProgress)
      .set({
        status: "COMPLETED",
        score,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(questProgress.learnerId, learnerId), eq(questProgress.questId, questId)));

    return { completed: true, score };
  });
}
