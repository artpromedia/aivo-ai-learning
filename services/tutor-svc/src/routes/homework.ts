import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { homeworkAssignments, homeworkSessions, tutorSubscriptions, learners } from "@aivo/db";
import { verifyJWT, JWTPayload } from "@aivo/security";

const AI_SVC_URL = process.env.AI_SVC_URL || "http://localhost:3004";
const BRAIN_SVC_URL = process.env.BRAIN_SVC_URL || "http://localhost:3002";
const LEARNING_SVC_URL = process.env.LEARNING_SVC_URL || "http://localhost:3005";

const SUBJECT_TO_SKU: Record<string, string> = {
  MATH: "ADDON_TUTOR_MATH",
  ELA: "ADDON_TUTOR_ELA",
  SCIENCE: "ADDON_TUTOR_SCIENCE",
  HISTORY: "ADDON_TUTOR_HISTORY",
  CODING: "ADDON_TUTOR_CODING",
};

async function extractAuth(request: FastifyRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    const cookieHeader = request.headers.cookie || "";
    const match = cookieHeader.match(/access_token=([^;]+)/);
    if (!match) return null;
    try {
      return await verifyJWT(match[1]);
    } catch {
      return null;
    }
  }
  try {
    return await verifyJWT(authHeader.slice(7));
  } catch {
    return null;
  }
}

async function verifyLearnerOwnership(
  db: any,
  learnerId: string,
  authUser: JWTPayload,
): Promise<boolean> {
  if (authUser.sub === learnerId) return true;
  if (authUser.role === "PLATFORM_ADMIN" || authUser.role === "DISTRICT_ADMIN") return true;

  const [learner] = await db
    .select({ parentId: learners.parentId })
    .from(learners)
    .where(eq(learners.id, learnerId));

  if (!learner) return false;
  return learner.parentId === authUser.sub;
}

async function fetchBrainContext(learnerId: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${BRAIN_SVC_URL}/api/brain/${learnerId}`);
    if (res.ok) {
      const data = await res.json();
      return (data as any).state || {};
    }
  } catch {}
  return {};
}

async function checkSubscription(db: any, userId: string, sku: string): Promise<boolean> {
  const subs = await db
    .select()
    .from(tutorSubscriptions)
    .where(
      and(
        eq(tutorSubscriptions.userId, userId),
        eq(tutorSubscriptions.tutorSku, sku),
        eq(tutorSubscriptions.status, "active"),
      ),
    );
  return subs.length > 0;
}

async function writeMasteryUpdate(
  learnerId: string,
  subject: string,
  completionQuality: number,
  problemsCompleted: number,
): Promise<void> {
  try {
    const skill = `homework_${subject}`;
    const masteryScore = Math.round(completionQuality * 100);
    await fetch(`${LEARNING_SVC_URL}/api/learning/gradebook/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-service": "tutor-svc" },
      body: JSON.stringify({
        learnerId,
        skill,
        masteryScore,
        sessionType: "homework",
        xpEarned: Math.min(problemsCompleted * 10, 50),
      }),
    });
  } catch (err) {
    console.error("Mastery write-back failed (non-blocking):", err);
  }
}

function getFunctioningLevel(brainContext: Record<string, unknown>): string {
  return (brainContext as any)?.functioning_level_profile?.level || "STANDARD";
}

async function getParentIdForLearner(db: any, learnerId: string): Promise<string | null> {
  const [learner] = await db
    .select({ parentId: learners.parentId })
    .from(learners)
    .where(eq(learners.id, learnerId));
  return learner?.parentId || null;
}

export function registerHomeworkRoutes(app: FastifyInstance, db: any) {
  app.post("/api/tutors/homework/upload", async (request, reply) => {
    const authUser = await extractAuth(request);
    if (!authUser) return reply.code(401).send({ error: "Authentication required" });

    const { learnerId, imageBase64, textInput, mimeType } = request.body as any;
    if (!learnerId) {
      return reply.code(400).send({ error: "learnerId is required" });
    }

    const hasAccess = await verifyLearnerOwnership(db, learnerId, authUser);
    if (!hasAccess) {
      return reply.code(403).send({ error: "You do not have access to this learner" });
    }

    try {
      const ocrRes = await fetch(`${AI_SVC_URL}/api/ai/homework/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imageBase64 || null,
          text_input: textInput || null,
          mime_type: mimeType || "image/jpeg",
        }),
      });

      if (!ocrRes.ok) {
        const err = await ocrRes.text();
        return reply.code(502).send({ error: "OCR processing failed", detail: err });
      }

      const ocrData: any = await ocrRes.json();
      const detectedSubject = ocrData.detected_subject?.subject || "OTHER";
      const requiredSku = SUBJECT_TO_SKU[detectedSubject];

      const parentId = await getParentIdForLearner(db, learnerId);
      const subscriptionOwner = parentId || authUser.sub;

      if (requiredSku) {
        const hasSub = await checkSubscription(db, subscriptionOwner, requiredSku);
        if (!hasSub) {
          return reply.code(403).send({
            error: "Subscription required",
            locked: true,
            requiredSku,
            detectedSubject,
            message: `You need a ${detectedSubject.toLowerCase()} tutor subscription to get help with this homework.`,
          });
        }
      }

      const brainContext = await fetchBrainContext(learnerId);
      const functioningLevel = getFunctioningLevel(brainContext);

      let adaptedProblems: any[] = [];
      if (ocrData.problems && ocrData.problems.length > 0) {
        try {
          const adaptRes = await fetch(`${AI_SVC_URL}/api/ai/homework/adapt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              extracted_problems: ocrData.problems,
              brain_context: brainContext,
              subject: detectedSubject.toLowerCase(),
            }),
          });

          if (adaptRes.ok) {
            const adaptData: any = await adaptRes.json();
            adaptedProblems = adaptData.adapted_problems || [];
          }
        } catch (err) {
          console.error("Adaptation failed, using raw problems:", err);
        }
      }

      const rawProblems = ocrData.problems || [];
      const finalStatus = rawProblems.length > 0 ? "READY" : "FAILED";

      const [assignment] = await db
        .insert(homeworkAssignments)
        .values({
          learnerId,
          subject: detectedSubject.toLowerCase(),
          originalFileType: mimeType || "text/plain",
          extractedText: ocrData.raw_text || textInput || "",
          extractedProblems: rawProblems,
          adaptedProblems: adaptedProblems.length > 0 ? adaptedProblems : rawProblems,
          homeworkMode: functioningLevel,
          status: finalStatus,
          detectedSubject,
          subjectConfidence: String(ocrData.detected_subject?.confidence || 0),
        })
        .returning();

      return {
        assignment: {
          id: assignment.id,
          subject: assignment.subject,
          status: assignment.status,
          homeworkMode: assignment.homeworkMode,
          detectedSubject,
          problemCount: rawProblems.length,
          adaptedCount: adaptedProblems.length,
          createdAt: assignment.createdAt,
        },
      };
    } catch (err: any) {
      return reply.code(500).send({ error: "Upload failed", detail: err.message });
    }
  });

  app.get("/api/tutors/homework/learner/:learnerId", async (request, reply) => {
    const authUser = await extractAuth(request);
    if (!authUser) return reply.code(401).send({ error: "Authentication required" });

    const { learnerId } = request.params as any;

    const hasAccess = await verifyLearnerOwnership(db, learnerId, authUser);
    if (!hasAccess) {
      return reply.code(403).send({ error: "You do not have access to this learner" });
    }

    const assignments = await db
      .select()
      .from(homeworkAssignments)
      .where(eq(homeworkAssignments.learnerId, learnerId))
      .orderBy(desc(homeworkAssignments.createdAt))
      .limit(20);

    return {
      assignments: assignments.map((a: any) => ({
        id: a.id,
        subject: a.subject,
        status: a.status,
        homeworkMode: a.homeworkMode,
        detectedSubject: a.detectedSubject,
        problemCount: (a.extractedProblems as any[])?.length || 0,
        adaptedCount: (a.adaptedProblems as any[])?.length || 0,
        createdAt: a.createdAt,
      })),
    };
  });

  app.get("/api/tutors/homework/:assignmentId", async (request, reply) => {
    const authUser = await extractAuth(request);
    if (!authUser) return reply.code(401).send({ error: "Authentication required" });

    const { assignmentId } = request.params as any;
    const [assignment] = await db
      .select()
      .from(homeworkAssignments)
      .where(eq(homeworkAssignments.id, assignmentId));

    if (!assignment) {
      return reply.code(404).send({ error: "Assignment not found" });
    }

    const hasAccess = await verifyLearnerOwnership(db, assignment.learnerId, authUser);
    if (!hasAccess) {
      return reply.code(403).send({ error: "You do not have access to this assignment" });
    }

    return assignment;
  });

  app.post("/api/tutors/homework/session/start", async (request, reply) => {
    const authUser = await extractAuth(request);
    if (!authUser) return reply.code(401).send({ error: "Authentication required" });

    const { assignmentId, learnerId } = request.body as any;
    if (!assignmentId || !learnerId) {
      return reply.code(400).send({ error: "assignmentId and learnerId required" });
    }

    const hasAccess = await verifyLearnerOwnership(db, learnerId, authUser);
    if (!hasAccess) {
      return reply.code(403).send({ error: "You do not have access to this learner" });
    }

    const [assignment] = await db
      .select()
      .from(homeworkAssignments)
      .where(
        and(
          eq(homeworkAssignments.id, assignmentId),
          eq(homeworkAssignments.learnerId, learnerId),
        ),
      );

    if (!assignment) {
      return reply.code(404).send({ error: "Assignment not found" });
    }

    const tutorSku = SUBJECT_TO_SKU[assignment.detectedSubject || "OTHER"] || "ADDON_TUTOR_MATH";

    const [session] = await db
      .insert(homeworkSessions)
      .values({
        homeworkAssignmentId: assignmentId,
        learnerId,
        tutorSku,
        messages: [],
      })
      .returning();

    await db
      .update(homeworkAssignments)
      .set({ status: "IN_PROGRESS" })
      .where(eq(homeworkAssignments.id, assignmentId));

    return {
      sessionId: session.id,
      assignmentId,
      tutorSku,
      subject: assignment.subject,
      adaptedProblems: assignment.adaptedProblems,
    };
  });

  app.get("/api/tutors/homework/session/:sessionId/state", async (request, reply) => {
    const authUser = await extractAuth(request);
    if (!authUser) return reply.code(401).send({ error: "Authentication required" });

    const { sessionId } = request.params as any;
    const [session] = await db
      .select()
      .from(homeworkSessions)
      .where(eq(homeworkSessions.id, sessionId));

    if (!session) return reply.code(404).send({ error: "Session not found" });

    const hasAccess = await verifyLearnerOwnership(db, session.learnerId, authUser);
    if (!hasAccess) {
      return reply.code(403).send({ error: "You do not have access to this session" });
    }

    const [assignment] = await db
      .select()
      .from(homeworkAssignments)
      .where(eq(homeworkAssignments.id, session.homeworkAssignmentId));

    return {
      sessionId: session.id,
      assignmentId: session.homeworkAssignmentId,
      learnerId: session.learnerId,
      tutorSku: session.tutorSku,
      subject: assignment?.subject || "",
      adaptedProblems: assignment?.adaptedProblems || [],
      messages: session.messages || [],
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
  });

  app.post("/api/tutors/homework/session/:sessionId/message", async (request, reply) => {
    const authUser = await extractAuth(request);
    if (!authUser) return reply.code(401).send({ error: "Authentication required" });

    const { sessionId } = request.params as any;
    const { message } = request.body as any;
    if (!message) return reply.code(400).send({ error: "message required" });

    const [session] = await db
      .select()
      .from(homeworkSessions)
      .where(eq(homeworkSessions.id, sessionId));

    if (!session) return reply.code(404).send({ error: "Session not found" });

    const hasAccess = await verifyLearnerOwnership(db, session.learnerId, authUser);
    if (!hasAccess) {
      return reply.code(403).send({ error: "You do not have access to this session" });
    }

    const [assignment] = await db
      .select()
      .from(homeworkAssignments)
      .where(eq(homeworkAssignments.id, session.homeworkAssignmentId));

    const existingMessages = (session.messages as any[]) || [];
    existingMessages.push({ role: "user", content: message, timestamp: new Date().toISOString() });

    const brainContext = await fetchBrainContext(session.learnerId);
    const functioningLevel = getFunctioningLevel(brainContext);

    try {
      const res = await fetch(`${AI_SVC_URL}/api/ai/homework/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_sku: session.tutorSku || "ADDON_TUTOR_MATH",
          learner_id: session.learnerId,
          functioning_level: functioningLevel,
          brain_context: brainContext,
          homework_context: assignment
            ? {
                subject: assignment.subject,
                adapted_problems: assignment.adaptedProblems,
              }
            : {},
          messages: existingMessages.map((m: any) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`ai-svc returned ${res.status}`);

      const data: any = await res.json();
      existingMessages.push({
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      });

      await db
        .update(homeworkSessions)
        .set({ messages: existingMessages })
        .where(eq(homeworkSessions.id, sessionId));

      return {
        response: data.response,
        model: data.model,
        messageCount: existingMessages.length,
      };
    } catch (err: any) {
      return reply.code(503).send({ error: "Homework chat failed", detail: err.message });
    }
  });

  app.post("/api/tutors/homework/session/:sessionId/complete", async (request, reply) => {
    const authUser = await extractAuth(request);
    if (!authUser) return reply.code(401).send({ error: "Authentication required" });

    const { sessionId } = request.params as any;
    const { problemsAttempted, problemsCompleted } = request.body as any;

    const [session] = await db
      .select()
      .from(homeworkSessions)
      .where(eq(homeworkSessions.id, sessionId));

    if (!session) return reply.code(404).send({ error: "Session not found" });

    const hasAccess = await verifyLearnerOwnership(db, session.learnerId, authUser);
    if (!hasAccess) {
      return reply.code(403).send({ error: "You do not have access to this session" });
    }

    const [assignment] = await db
      .select()
      .from(homeworkAssignments)
      .where(eq(homeworkAssignments.id, session.homeworkAssignmentId));

    const messages = (session.messages as any[]) || [];
    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    const attempted = problemsAttempted || (assignment?.extractedProblems as any[])?.length || 0;
    const completed = problemsCompleted || 0;
    const quality = attempted > 0 ? Math.min(1.0, completed / attempted) : Math.min(1.0, messages.length / 10);
    const completionQuality = String(quality);

    await db
      .update(homeworkSessions)
      .set({
        problemsAttempted: attempted,
        problemsCompleted: completed,
        hintsUsed: messages.filter((m: any) => m.role === "assistant").length,
        durationSeconds,
        completionQuality,
        endedAt: new Date(),
      })
      .where(eq(homeworkSessions.id, sessionId));

    await db
      .update(homeworkAssignments)
      .set({ status: "COMPLETED" })
      .where(eq(homeworkAssignments.id, session.homeworkAssignmentId));

    const subject = assignment?.subject || "general";
    await writeMasteryUpdate(session.learnerId, subject, quality, completed);

    return { status: "completed", sessionId, durationSeconds, xpEarned: Math.min(completed * 10, 50) };
  });

  app.get("/api/tutors/homework/parent/:parentId", async (request, reply) => {
    const authUser = await extractAuth(request);
    if (!authUser) return reply.code(401).send({ error: "Authentication required" });

    const { parentId } = request.params as any;

    if (authUser.sub !== parentId && authUser.role !== "PLATFORM_ADMIN" && authUser.role !== "DISTRICT_ADMIN") {
      return reply.code(403).send({ error: "Access denied" });
    }

    const childLearners = await db
      .select({ id: learners.id, displayName: learners.displayName })
      .from(learners)
      .where(eq(learners.parentId, parentId));

    const results: any[] = [];
    for (const child of childLearners) {
      const assignments = await db
        .select()
        .from(homeworkAssignments)
        .where(eq(homeworkAssignments.learnerId, child.id))
        .orderBy(desc(homeworkAssignments.createdAt))
        .limit(10);

      results.push({
        learnerId: child.id,
        learnerName: child.displayName,
        assignments: assignments.map((a: any) => ({
          id: a.id,
          subject: a.subject,
          status: a.status,
          detectedSubject: a.detectedSubject,
          problemCount: (a.extractedProblems as any[])?.length || 0,
          createdAt: a.createdAt,
        })),
      });
    }

    return { children: results };
  });
}
