import { FastifyInstance } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import {
  iepGoals,
  iepProfiles,
  iepDocuments,
  learners,
  brainStates,
  lessonSessions,
  tutorSessions,
} from "@aivo/db";
import { authenticateRequest, verifyParentOwnership } from "../auth.js";

interface LearnerId {
  learnerId: string;
}

interface GoalIdParams extends LearnerId {
  goalId: string;
}

function extractBrainMastery(brainState: { masteryLevels: unknown } | undefined): Record<string, number> {
  if (!brainState) return {};
  const levels = brainState.masteryLevels as Record<string, unknown> || {};
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(levels)) {
    if (typeof val === "number") {
      result[key] = val;
    } else if (typeof val === "object" && val !== null) {
      const inner = val as Record<string, number>;
      const values = Object.values(inner).filter(v => typeof v === "number");
      if (values.length > 0) {
        result[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      }
    }
  }
  return result;
}

export async function registerIepRoutes(app: FastifyInstance) {
  const db = (app as unknown as { db: ReturnType<typeof import("@aivo/db").createDb> }).db;

  app.get("/api/family/iep/:learnerId/goals", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as LearnerId;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    return db.select().from(iepGoals)
      .where(eq(iepGoals.learnerId, learnerId))
      .orderBy(desc(iepGoals.createdAt));
  });

  app.get("/api/family/iep/:learnerId/goals/:goalId", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId, goalId } = request.params as GoalIdParams;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    const goal = await db.select().from(iepGoals).where(
      and(eq(iepGoals.id, goalId), eq(iepGoals.learnerId, learnerId))
    );
    if (goal.length === 0) return reply.code(404).send({ error: "Goal not found" });

    return goal[0];
  });

  app.get("/api/family/iep/:learnerId/profile", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as LearnerId;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    const profiles = await db.select().from(iepProfiles)
      .where(eq(iepProfiles.learnerId, learnerId))
      .orderBy(desc(iepProfiles.createdAt));

    return profiles[0] || null;
  });

  app.get("/api/family/iep/:learnerId/documents", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as LearnerId;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    return db.select().from(iepDocuments)
      .where(eq(iepDocuments.learnerId, learnerId))
      .orderBy(desc(iepDocuments.uploadedAt));
  });

  app.get("/api/family/iep/:learnerId/progress", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as LearnerId;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    const goals = await db.select().from(iepGoals)
      .where(eq(iepGoals.learnerId, learnerId));

    const brainRows = await db.select().from(brainStates)
      .where(eq(brainStates.learnerId, learnerId));

    const masteryMap = extractBrainMastery(brainRows[0] as { masteryLevels: unknown } | undefined);

    const goalProgress = goals.map((goal) => {
      const domain = goal.domain || "";
      const currentMastery = masteryMap[domain] || 0;
      const baselineVal = parseFloat(goal.baseline || "0") || 0;
      const targetVal = parseFloat(goal.targetCriteria || "100") || 100;
      const range = targetVal - baselineVal;
      const progressPct = range > 0 ? Math.min(100, Math.max(0, ((currentMastery - baselineVal) / range) * 100)) : 0;

      let trend: "improving" | "stable" | "declining" = "stable";
      if ((goal.currentProgress ?? 0) > 0) {
        if (currentMastery > (goal.currentProgress ?? 0)) trend = "improving";
        else if (currentMastery < (goal.currentProgress ?? 0)) trend = "declining";
      }

      return {
        goalId: goal.id,
        goalText: goal.goalText,
        domain: goal.domain,
        baseline: goal.baseline,
        targetCriteria: goal.targetCriteria,
        currentValue: currentMastery,
        currentProgress: goal.currentProgress,
        progressPercent: Math.round(progressPct),
        trend,
        status: goal.status,
      };
    });

    return {
      learnerId,
      goals: goalProgress,
      totalGoals: goals.length,
      activeGoals: goals.filter((g) => g.status === "active").length,
      brainStateVersion: brainRows[0]?.version || 0,
    };
  });

  app.get("/api/family/iep/:learnerId/report", async (request, reply) => {
    const claims = await authenticateRequest(request, reply);
    if (!claims) return;

    const { learnerId } = request.params as LearnerId;
    const isParent = await verifyParentOwnership(db, claims.sub, learnerId);
    if (!isParent && claims.role !== "PLATFORM_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    const learnerRows = await db.select().from(learners).where(eq(learners.id, learnerId));
    if (learnerRows.length === 0) return reply.code(404).send({ error: "Learner not found" });
    const learner = learnerRows[0];

    const goals = await db.select().from(iepGoals).where(eq(iepGoals.learnerId, learnerId));
    const profile = await db.select().from(iepProfiles).where(eq(iepProfiles.learnerId, learnerId));
    const brainRows = await db.select().from(brainStates).where(eq(brainStates.learnerId, learnerId));
    const sessions = await db.select().from(lessonSessions)
      .where(eq(lessonSessions.learnerId, learnerId))
      .orderBy(desc(lessonSessions.startedAt));
    const tSessions = await db.select().from(tutorSessions)
      .where(eq(tutorSessions.learnerId, learnerId))
      .orderBy(desc(tutorSessions.startedAt));

    const masteryMap = extractBrainMastery(brainRows[0] as { masteryLevels: unknown } | undefined);

    const sessionsBySubject: Record<string, { count: number; completed: number; totalXp: number; latestDate: string | null }> = {};
    for (const s of sessions) {
      const subj = s.subject;
      if (!sessionsBySubject[subj]) sessionsBySubject[subj] = { count: 0, completed: 0, totalXp: 0, latestDate: null };
      sessionsBySubject[subj].count++;
      if (s.status === "COMPLETED") sessionsBySubject[subj].completed++;
      sessionsBySubject[subj].totalXp += s.xpEarned || 0;
      const dt = s.completedAt?.toISOString() || s.startedAt?.toISOString() || null;
      if (dt && (!sessionsBySubject[subj].latestDate || dt > sessionsBySubject[subj].latestDate!)) {
        sessionsBySubject[subj].latestDate = dt;
      }
    }
    for (const ts of tSessions) {
      const subj = ts.tutorName || ts.tutorSku;
      if (!sessionsBySubject[subj]) sessionsBySubject[subj] = { count: 0, completed: 0, totalXp: 0, latestDate: null };
      sessionsBySubject[subj].count++;
      if (ts.completedAt) sessionsBySubject[subj].completed++;
      sessionsBySubject[subj].totalXp += ts.xpEarned || 0;
    }

    const goalSections = goals.map((goal) => {
      const domain = goal.domain || "";
      const currentMastery = masteryMap[domain] || 0;
      const baselineVal = parseFloat(goal.baseline || "0") || 0;
      const targetVal = parseFloat(goal.targetCriteria || "100") || 100;
      const range = targetVal - baselineVal;
      const progressPct = range > 0 ? Math.min(100, Math.max(0, ((currentMastery - baselineVal) / range) * 100)) : 0;

      const domainSessions = sessionsBySubject[domain] || { count: 0, completed: 0, totalXp: 0, latestDate: null };

      const evidenceParts: string[] = [];
      evidenceParts.push(`Current Brain mastery in ${domain || "this area"}: ${currentMastery}%.`);
      evidenceParts.push(`Baseline: ${goal.baseline || "N/A"}, Target: ${goal.targetCriteria || "N/A"}.`);
      if (domainSessions.count > 0) {
        evidenceParts.push(`${domainSessions.completed} of ${domainSessions.count} sessions completed, earning ${domainSessions.totalXp} XP.`);
        if (domainSessions.latestDate) {
          evidenceParts.push(`Most recent session: ${new Date(domainSessions.latestDate).toLocaleDateString()}.`);
        }
      } else {
        evidenceParts.push("No lesson sessions recorded in this domain yet.");
      }

      return {
        goalText: goal.goalText,
        domain: goal.domain,
        baseline: goal.baseline,
        target: goal.targetCriteria,
        currentMastery,
        progressPercent: Math.round(progressPct),
        status: goal.status,
        evidence: evidenceParts.join(" "),
        sessionEvidence: {
          sessionCount: domainSessions.count,
          completedSessions: domainSessions.completed,
          totalXp: domainSessions.totalXp,
          lastSessionDate: domainSessions.latestDate,
        },
      };
    });

    const totalSessions = sessions.length + tSessions.length;
    const completedSessions = sessions.filter(s => s.status === "COMPLETED").length + tSessions.filter(ts => ts.completedAt).length;

    const report = {
      title: `IEP Progress Report — ${learner.name}`,
      generatedAt: new Date().toISOString(),
      learner: {
        name: learner.name,
        gradeLevel: learner.gradeLevel,
        functioningLevel: learner.functioningLevel,
        dateOfBirth: learner.dateOfBirth,
      },
      iepProfile: profile[0] || null,
      brainSummary: {
        version: brainRows[0]?.version || 0,
        activeAccommodations: brainRows[0]?.activeAccommodations || [],
        functioningLevelProfile: brainRows[0]?.functioningLevelProfile || {},
        masteryLevels: masteryMap,
      },
      sessionSummary: {
        totalSessions,
        completedSessions,
        totalXp: sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0),
      },
      goals: goalSections,
      summary: {
        totalGoals: goals.length,
        activeGoals: goals.filter((g) => g.status === "active").length,
        metGoals: goals.filter((g) => g.status === "met").length,
        averageProgress: goalSections.length > 0
          ? Math.round(goalSections.reduce((sum, g) => sum + g.progressPercent, 0) / goalSections.length)
          : 0,
      },
    };

    return report;
  });
}
