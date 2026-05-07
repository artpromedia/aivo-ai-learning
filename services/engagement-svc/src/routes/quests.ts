import { FastifyInstance } from "fastify";
import { eq, and, asc } from "drizzle-orm";
import { quests, questProgress } from "@aivo/db";
import { authenticateRequest } from "../auth.js";
import { getQuestsWorldsSchema, getQuestsByWorldKeySchema, getQuestsProgressByLearnerIdSchema, questsStartSchema, questsCompleteSchema } from "./schemas.js";

const QUEST_WORLDS = [
  {
    key: "nova_number_galaxy",
    name: "Nova's Number Galaxy",
    tutorKey: "nova",
    subject: "Mathematics",
    description: "Explore the cosmos of numbers with Nova!",
    chapters: 5,
  },
  {
    key: "sage_story_kingdom",
    name: "Sage's Story Kingdom",
    tutorKey: "sage",
    subject: "English Language Arts",
    description: "Journey through the kingdom of stories with Sage!",
    chapters: 5,
  },
  {
    key: "spark_science_lab",
    name: "Spark's Science Lab",
    tutorKey: "spark",
    subject: "Science",
    description: "Discover the wonders of science with Spark!",
    chapters: 5,
  },
  {
    key: "chrono_time_tower",
    name: "Chrono's Time Tower",
    tutorKey: "chrono",
    subject: "History",
    description: "Travel through time with Chrono!",
    chapters: 5,
  },
  {
    key: "pixel_code_forge",
    name: "Pixel's Code Forge",
    tutorKey: "pixel",
    subject: "Coding & Computer Science",
    description: "Build amazing things with Pixel!",
    chapters: 5,
  },
];

export function registerQuestRoutes(
  app: FastifyInstance,
  db: ReturnType<typeof import("@aivo/db").createDb>
) {
  app.get("/api/engagement/quests/worlds", { schema: getQuestsWorldsSchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;
    return QUEST_WORLDS;
  });

  app.get("/api/engagement/quests/:worldKey", { schema: getQuestsByWorldKeySchema }, async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { worldKey } = request.params as { worldKey: string };
    const worldQuests = await db
      .select()
      .from(quests)
      .where(eq(quests.worldKey, worldKey))
      .orderBy(asc(quests.chapterNumber));

    return { world: QUEST_WORLDS.find((w) => w.key === worldKey), quests: worldQuests };
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
