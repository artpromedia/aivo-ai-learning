import { FastifyInstance } from "fastify";
import { eq, and, desc, isNull, asc, sql } from "drizzle-orm";
import { learners, learnerSettings, parentNotifications, learnerMilestones, learnerStreaks, learnerBadges, users } from "@aivo/db";
import { authenticateRequest, verifyParentOwnership } from "../auth.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export async function registerParentDashboardRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.get("/api/family/learner-settings/:learnerId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { learnerId } = req.params as { learnerId: string };
    const owns = await verifyParentOwnership(db, auth.sub, learnerId);
    if (!owns) return reply.code(403).send({ error: "Forbidden" });

    const [existing] = await db.select().from(learnerSettings).where(eq(learnerSettings.learnerId, learnerId));
    if (existing) return existing;

    return {
      learnerId,
      accommodations: { readAloud: true, simplifiedUI: false, extendedTime: false, breakReminders: true, visualSupports: false, reducedAnimations: false, highContrast: false, fontSize: "normal" },
      learningGoals: { dailyGoalMinutes: 30, weeklySessionTarget: 5, preferredSessionTime: "afternoon" },
      notifications: { milestoneAlerts: true, struggleAlerts: true, weeklyDigest: true, sessionReminders: false, iepReminders: true },
      tutorPreferences: { preferredTutorKey: null, sessionLengthPreference: "medium", musicDuringSessions: false, celebrationAnimations: true },
    };
  });

  app.put("/api/family/learner-settings/:learnerId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { learnerId } = req.params as { learnerId: string };
    const owns = await verifyParentOwnership(db, auth.sub, learnerId);
    if (!owns) return reply.code(403).send({ error: "Forbidden" });

    const body = req.body as any;
    const [existing] = await db.select().from(learnerSettings).where(eq(learnerSettings.learnerId, learnerId));

    if (existing) {
      await db.update(learnerSettings).set({
        accommodations: body.accommodations ?? existing.accommodations,
        learningGoals: body.learningGoals ?? existing.learningGoals,
        notifications: body.notifications ?? existing.notifications,
        tutorPreferences: body.tutorPreferences ?? existing.tutorPreferences,
        updatedAt: new Date(),
        updatedBy: auth.sub,
      }).where(eq(learnerSettings.learnerId, learnerId));
    } else {
      await db.insert(learnerSettings).values({
        learnerId,
        accommodations: body.accommodations ?? {},
        learningGoals: body.learningGoals ?? {},
        notifications: body.notifications ?? {},
        tutorPreferences: body.tutorPreferences ?? {},
        updatedBy: auth.sub,
      });
    }

    const [updated] = await db.select().from(learnerSettings).where(eq(learnerSettings.learnerId, learnerId));
    return updated;
  });

  app.get("/api/family/inbox/:parentId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { parentId } = req.params as { parentId: string };
    if (!isUuid(parentId) || !isUuid(auth.sub)) return { items: [], unreadCount: 0 };
    if (auth.sub !== parentId && auth.role !== "PLATFORM_ADMIN") return reply.code(403).send({ error: "Forbidden" });

    const { filter, limit: lim } = req.query as { filter?: string; limit?: string };
    const pageSize = Math.min(parseInt(lim || "50"), 100);

    let conditions: any[] = [eq(parentNotifications.parentId, parentId), isNull(parentNotifications.dismissedAt)];
    if (filter === "unread") conditions.push(isNull(parentNotifications.readAt));

    try {
      const items = await db.select().from(parentNotifications)
        .where(and(...conditions))
        .orderBy(desc(parentNotifications.createdAt))
        .limit(pageSize);

      const [unreadCount] = await db.select({ count: sql<number>`count(*)` }).from(parentNotifications)
        .where(and(eq(parentNotifications.parentId, parentId), isNull(parentNotifications.readAt), isNull(parentNotifications.dismissedAt)));

      return { items, unreadCount: Number(unreadCount?.count || 0) };
    } catch (_err) {
      return { items: [], unreadCount: 0 };
    }
  });

  app.put("/api/family/inbox/:notificationId/read", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { notificationId } = req.params as { notificationId: string };

    const [notif] = await db.select().from(parentNotifications).where(eq(parentNotifications.id, notificationId));
    if (!notif) return reply.code(404).send({ error: "Not found" });
    if (notif.parentId !== auth.sub && auth.role !== "PLATFORM_ADMIN") return reply.code(403).send({ error: "Forbidden" });

    await db.update(parentNotifications).set({ readAt: new Date() }).where(eq(parentNotifications.id, notificationId));
    return { success: true };
  });

  app.put("/api/family/inbox/:notificationId/dismiss", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { notificationId } = req.params as { notificationId: string };

    const [notif] = await db.select().from(parentNotifications).where(eq(parentNotifications.id, notificationId));
    if (!notif) return reply.code(404).send({ error: "Not found" });
    if (notif.parentId !== auth.sub && auth.role !== "PLATFORM_ADMIN") return reply.code(403).send({ error: "Forbidden" });

    await db.update(parentNotifications).set({ dismissedAt: new Date() }).where(eq(parentNotifications.id, notificationId));
    return { success: true };
  });

  app.get("/api/family/activity-feed/:parentId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { parentId } = req.params as { parentId: string };
    if (!isUuid(parentId) || !isUuid(auth.sub)) return { activities: [], learners: [] };
    if (auth.sub !== parentId && auth.role !== "PLATFORM_ADMIN") return reply.code(403).send({ error: "Forbidden" });

    const { since } = req.query as { since?: string };
    let sinceDate: Date | null = null;
    if (since) {
      const parsed = new Date(since);
      if (!Number.isNaN(parsed.getTime())) {
        sinceDate = parsed;
      }
    }

    let parentLearners: Array<{ id: string; name: string }> = [];
    try {
      parentLearners = await db.select({ id: learners.id, name: learners.name }).from(learners).where(eq(learners.parentId, parentId));
    } catch (_err) {
      return { activities: [], learners: [] };
    }
    const learnerIds = parentLearners.map((l: { id: string; name: string }) => l.id);

    if (learnerIds.length === 0) return { activities: [], learners: [] };

    let milestones: any[] = [];
    try {
      for (const lid of learnerIds) {
        let conditions: any[] = [eq(learnerMilestones.learnerId, lid)];
        if (sinceDate) conditions.push(sql`${learnerMilestones.createdAt} > ${sinceDate}`);
        const m = await db.select().from(learnerMilestones).where(and(...conditions)).orderBy(desc(learnerMilestones.createdAt)).limit(20);
        milestones.push(...m.map((item: any) => ({ ...item, learnerName: parentLearners.find((l: { id: string; name: string }) => l.id === lid)?.name })));
      }
    } catch (err) {
      app.log.error({ err, parentId }, "Failed to build parent activity feed");
      return { activities: [], learners: parentLearners };
    }

    milestones.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { activities: milestones.slice(0, 20), learners: parentLearners };
  });

  app.get("/api/family/milestones/:learnerId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { learnerId } = req.params as { learnerId: string };
    const owns = await verifyParentOwnership(db, auth.sub, learnerId);
    if (!owns) return reply.code(403).send({ error: "Forbidden" });

    const milestones = await db.select().from(learnerMilestones)
      .where(eq(learnerMilestones.learnerId, learnerId))
      .orderBy(desc(learnerMilestones.createdAt));

    const badges = await db.select().from(learnerBadges)
      .where(eq(learnerBadges.learnerId, learnerId))
      .orderBy(desc(learnerBadges.earnedAt));

    const [streak] = await db.select().from(learnerStreaks)
      .where(eq(learnerStreaks.learnerId, learnerId));

    return { milestones, badges, streak: streak || { currentStreak: 0, longestStreak: 0 } };
  });

  app.get("/api/family/streaks/:learnerId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { learnerId } = req.params as { learnerId: string };
    const owns = await verifyParentOwnership(db, auth.sub, learnerId);
    if (!owns) return reply.code(403).send({ error: "Forbidden" });

    const [streak] = await db.select().from(learnerStreaks).where(eq(learnerStreaks.learnerId, learnerId));
    return streak || { learnerId, currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  });

  app.get("/api/family/summary/:parentId", async (req: any, reply: any) => {
    const auth = await authenticateRequest(req, reply);
    if (!auth) return;
    const { parentId } = req.params as { parentId: string };
    if (!isUuid(parentId) || !isUuid(auth.sub)) return { parent: null, learners: [] };
    if (auth.sub !== parentId && auth.role !== "PLATFORM_ADMIN") return reply.code(403).send({ error: "Forbidden" });

    let parent: { lastDashboardVisit: Date | null; name: string | null } | undefined;
    let parentLearners: any[] = [];
    try {
      [parent] = await db.select({ lastDashboardVisit: users.lastDashboardVisit, name: users.name }).from(users).where(eq(users.id, parentId));
      parentLearners = await db.select().from(learners).where(eq(learners.parentId, parentId));
    } catch (_err) {
      return { parent: null, learners: [] };
    }

    let learnerSummaries: any[] = [];
    try {
      learnerSummaries = await Promise.all(parentLearners.map(async (l: any) => {
        const [streak] = await db.select().from(learnerStreaks).where(eq(learnerStreaks.learnerId, l.id));
        const [badge_count] = await db.select({ count: sql<number>`count(*)` }).from(learnerBadges).where(eq(learnerBadges.learnerId, l.id));
        const recentMilestones = await db.select().from(learnerMilestones)
          .where(eq(learnerMilestones.learnerId, l.id))
          .orderBy(desc(learnerMilestones.createdAt))
          .limit(3);

        return {
          ...l,
          streak: streak || { currentStreak: 0, longestStreak: 0 },
          badgeCount: Number(badge_count?.count || 0),
          recentMilestones,
        };
      }));
    } catch (err) {
      app.log.error({ err, parentId }, "Failed to build parent summary");
      learnerSummaries = parentLearners.map((l: any) => ({
        ...l,
        streak: { currentStreak: 0, longestStreak: 0 },
        badgeCount: 0,
        recentMilestones: [],
      }));
    }

    try {
      await db.update(users).set({ lastDashboardVisit: new Date() }).where(eq(users.id, parentId));
    } catch (_err) {
      // Ignore non-critical update failures so dashboard data can still be returned.
    }

    return {
      parent: { name: parent?.name, lastDashboardVisit: parent?.lastDashboardVisit },
      learners: learnerSummaries,
    };
  });
}
