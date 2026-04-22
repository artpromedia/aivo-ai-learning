import { FastifyInstance } from "fastify";
import { eq, and, or, desc } from "drizzle-orm";
import {
  iepEvaluations,
  learners,
  learnerTeachers,
} from "@aivo/db";
import { verifyJWT } from "@aivo/security";

interface AuthClaims {
  sub: string;
  tenantId: string;
  role: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

async function authenticate(req: any, reply: any): Promise<AuthClaims | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Authentication required" });
    return null;
  }
  try {
    return (await verifyJWT(auth.slice(7))) as AuthClaims;
  } catch {
    reply.code(401).send({ error: "Invalid token" });
    return null;
  }
}

async function isTeacherOf(db: any, userSub: string, learnerId: string): Promise<boolean> {
  if (!isUuid(userSub) || !isUuid(learnerId)) return false;
  const rows = await db.select().from(learnerTeachers).where(
    and(
      eq(learnerTeachers.learnerId, learnerId),
      eq(learnerTeachers.teacherUserId, userSub),
      eq(learnerTeachers.status, "ACCEPTED"),
    ),
  );
  return rows.length > 0;
}

async function isParentOf(db: any, userSub: string, learnerId: string): Promise<boolean> {
  if (!isUuid(userSub) || !isUuid(learnerId)) return false;
  const rows = await db.select().from(learners).where(
    and(eq(learners.id, learnerId), eq(learners.parentId, userSub)),
  );
  return rows.length > 0;
}

async function getLearner(db: any, learnerId: string) {
  if (!isUuid(learnerId)) return null;
  const [row] = await db.select().from(learners).where(eq(learners.id, learnerId));
  return row || null;
}

async function canRead(db: any, claims: AuthClaims, learnerId: string): Promise<boolean> {
  const learner = await getLearner(db, learnerId);
  if (!learner) return false;
  if (claims.role === "PLATFORM_ADMIN") return true;
  if (claims.role === "DISTRICT_ADMIN") {
    return claims.tenantId === learner.tenantId;
  }
  if (await isTeacherOf(db, claims.sub, learnerId)) return true;
  if (await isParentOf(db, claims.sub, learnerId)) return true;
  return false;
}

async function canWrite(db: any, claims: AuthClaims, learnerId: string): Promise<boolean> {
  const learner = await getLearner(db, learnerId);
  if (!learner) return false;
  if (claims.role === "PLATFORM_ADMIN") return true;
  if (claims.role === "DISTRICT_ADMIN" || claims.role === "THERAPIST") {
    return claims.tenantId === learner.tenantId;
  }
  if (claims.role === "TEACHER" && await isTeacherOf(db, claims.sub, learnerId)) return true;
  return false;
}

// Strip internal fields from an evaluation row before returning to a parent.
// Parents only see submitted/decided records and only the team-shared summary.
function parentSummary(row: any) {
  return {
    id: row.id,
    learnerId: row.learnerId,
    status: row.status,
    eligibilityDecision: row.decisionEligible || null,
    decisionCategories: row.decisionCategories || [],
    decisionRationale: row.decisionRationale || null,
    submittedAt: row.submittedAt,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
  };
}

const PARENT_VISIBLE_STATUSES = ["submitted", "eligibility_determined"] as const;

export async function registerIepEvaluationRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  // Create a draft evaluation
  app.post("/api/iep/evaluations", {
    schema: {
      tags: ["IEP-Evaluations"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["learnerId"],
        properties: {
          learnerId: { type: "string" },
          referralReason: { type: "string" },
          assessmentAreas: { type: "array" },
          observations: { type: "string" },
          parentInput: { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const claims = await authenticate(req, reply);
    if (!claims) return;
    const body = req.body as any;
    const learner = await getLearner(db, body.learnerId);
    if (!learner) return reply.code(404).send({ error: "Learner not found" });
    if (!await canWrite(db, claims, body.learnerId)) {
      return reply.code(403).send({ error: "Access denied" });
    }

    const [row] = await db.insert(iepEvaluations).values({
      learnerId: body.learnerId,
      tenantId: learner.tenantId,
      initiatedByUserId: claims.sub,
      status: "draft",
      referralReason: body.referralReason || null,
      assessmentAreas: body.assessmentAreas || [],
      observations: body.observations || null,
      parentInput: body.parentInput || null,
    }).returning();
    return row;
  });

  // List evaluations for a learner
  app.get("/api/iep/evaluations/learner/:learnerId", async (req, reply) => {
    const claims = await authenticate(req, reply);
    if (!claims) return;
    const { learnerId } = req.params as { learnerId: string };
    if (!await canRead(db, claims, learnerId)) {
      return reply.code(403).send({ error: "Access denied" });
    }
    const rows = await db.select().from(iepEvaluations)
      .where(eq(iepEvaluations.learnerId, learnerId))
      .orderBy(desc(iepEvaluations.createdAt));
    // Parents only see submitted/decided records, and only summary fields.
    if (claims.role === "PARENT") {
      return rows
        .filter((r: any) => (PARENT_VISIBLE_STATUSES as readonly string[]).includes(r.status))
        .map(parentSummary);
    }
    return rows;
  });

  // Get single evaluation
  app.get("/api/iep/evaluations/:id", async (req, reply) => {
    const claims = await authenticate(req, reply);
    if (!claims) return;
    const { id } = req.params as { id: string };
    if (!isUuid(id)) return reply.code(400).send({ error: "Invalid id" });
    const [row] = await db.select().from(iepEvaluations).where(eq(iepEvaluations.id, id));
    if (!row) return reply.code(404).send({ error: "Evaluation not found" });
    if (!await canRead(db, claims, row.learnerId)) {
      return reply.code(403).send({ error: "Access denied" });
    }
    if (claims.role === "PARENT") {
      if (!(PARENT_VISIBLE_STATUSES as readonly string[]).includes(row.status)) {
        return reply.code(404).send({ error: "Evaluation not found" });
      }
      return parentSummary(row);
    }
    return row;
  });

  // Update a draft/submitted evaluation
  app.patch("/api/iep/evaluations/:id", async (req, reply) => {
    const claims = await authenticate(req, reply);
    if (!claims) return;
    const { id } = req.params as { id: string };
    if (!isUuid(id)) return reply.code(400).send({ error: "Invalid id" });
    const [existing] = await db.select().from(iepEvaluations).where(eq(iepEvaluations.id, id));
    if (!existing) return reply.code(404).send({ error: "Evaluation not found" });
    if (!await canWrite(db, claims, existing.learnerId)) {
      return reply.code(403).send({ error: "Access denied" });
    }
    if (existing.status === "eligibility_determined") {
      return reply.code(409).send({ error: "Decision already recorded; cannot edit" });
    }
    const body = req.body as any;
    const update: any = { updatedAt: new Date() };
    if (body.referralReason !== undefined) update.referralReason = body.referralReason;
    if (body.assessmentAreas !== undefined) update.assessmentAreas = body.assessmentAreas;
    if (body.observations !== undefined) update.observations = body.observations;
    if (body.parentInput !== undefined) update.parentInput = body.parentInput;
    // Status-guarded write so a concurrent decision call cannot be overwritten.
    const updated = await db.update(iepEvaluations).set(update).where(and(
      eq(iepEvaluations.id, id),
      or(eq(iepEvaluations.status, "draft"), eq(iepEvaluations.status, "submitted")),
    )).returning();
    if (updated.length === 0) {
      return reply.code(409).send({ error: "Evaluation status changed; please reload" });
    }
    return updated[0];
  });

  // Request AI eligibility suggestion
  app.post("/api/iep/evaluations/:id/suggest", async (req, reply) => {
    const claims = await authenticate(req, reply);
    if (!claims) return;
    const { id } = req.params as { id: string };
    if (!isUuid(id)) return reply.code(400).send({ error: "Invalid id" });
    const [evalRow] = await db.select().from(iepEvaluations).where(eq(iepEvaluations.id, id));
    if (!evalRow) return reply.code(404).send({ error: "Evaluation not found" });
    if (!await canWrite(db, claims, evalRow.learnerId)) {
      return reply.code(403).send({ error: "Access denied" });
    }

    const AI_SVC_URL = process.env.AI_SVC_URL || "http://localhost:3004";
    let suggestion: any = null;
    try {
      const aiRes = await fetch(`${AI_SVC_URL}/api/ai/eligibility-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referral_reason: evalRow.referralReason || "",
          assessment_areas: evalRow.assessmentAreas || [],
          observations: evalRow.observations || "",
          parent_input: evalRow.parentInput || "",
        }),
      });
      if (aiRes.ok) suggestion = await aiRes.json();
    } catch (err) {
      req.log.error({ err }, "AI eligibility-suggest call failed");
    }
    if (!suggestion) {
      return reply.code(502).send({ error: "AI eligibility suggestion unavailable" });
    }
    const [row] = await db.update(iepEvaluations)
      .set({ aiSuggestion: suggestion, updatedAt: new Date() })
      .where(eq(iepEvaluations.id, id)).returning();
    return row;
  });

  // Submit (move from draft → submitted)
  app.post("/api/iep/evaluations/:id/submit", async (req, reply) => {
    const claims = await authenticate(req, reply);
    if (!claims) return;
    const { id } = req.params as { id: string };
    if (!isUuid(id)) return reply.code(400).send({ error: "Invalid id" });
    const [existing] = await db.select().from(iepEvaluations).where(eq(iepEvaluations.id, id));
    if (!existing) return reply.code(404).send({ error: "Evaluation not found" });
    if (!await canWrite(db, claims, existing.learnerId)) {
      return reply.code(403).send({ error: "Access denied" });
    }
    if (existing.status !== "draft") {
      return reply.code(409).send({ error: `Cannot submit from status '${existing.status}'` });
    }
    const [row] = await db.update(iepEvaluations)
      .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(iepEvaluations.id, id)).returning();
    return row;
  });

  // Record team eligibility decision (eligible | not_eligible | needs_more_data).
  // The status moves to "eligibility_determined" regardless of which value the
  // team chose; the specific outcome lives in `decisionEligible`.
  app.post("/api/iep/evaluations/:id/decision", {
    schema: {
      tags: ["IEP-Evaluations"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          decision: { type: "string", enum: ["eligible", "not_eligible", "needs_more_data"] },
          eligible: { type: "boolean" },
          categories: { type: "array", items: { type: "string" } },
          rationale: { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const claims = await authenticate(req, reply);
    if (!claims) return;
    const { id } = req.params as { id: string };
    if (!isUuid(id)) return reply.code(400).send({ error: "Invalid id" });
    const [existing] = await db.select().from(iepEvaluations).where(eq(iepEvaluations.id, id));
    if (!existing) return reply.code(404).send({ error: "Evaluation not found" });
    if (!await canWrite(db, claims, existing.learnerId)) {
      return reply.code(403).send({ error: "Access denied" });
    }
    if (existing.status !== "submitted") {
      return reply.code(409).send({ error: "Evaluation must be submitted before recording a decision" });
    }
    type Decision = "eligible" | "not_eligible" | "needs_more_data";
    const body = req.body as {
      decision?: Decision;
      eligible?: boolean;
      categories?: string[];
      rationale?: string;
    };
    let decision: Decision | null = null;
    if (body.decision === "eligible" || body.decision === "not_eligible" || body.decision === "needs_more_data") {
      decision = body.decision;
    } else if (body.eligible === true) {
      decision = "eligible";
    } else if (body.eligible === false) {
      decision = "not_eligible";
    }
    if (!decision) {
      return reply.code(400).send({ error: "decision is required" });
    }
    // Validate categories against the IDEA-13 enum so we don't persist arbitrary strings.
    const ALLOWED_CATEGORIES = new Set([
      "autism", "specific_learning_disability", "speech_language_impairment",
      "other_health_impairment", "emotional_disturbance", "intellectual_disability",
      "developmental_delay", "hearing_impairment", "visual_impairment",
      "orthopedic_impairment", "traumatic_brain_injury", "multiple_disabilities",
      "deaf_blindness", "deafness",
    ]);
    const cleanCategories = Array.isArray(body.categories)
      ? body.categories.filter((c) => typeof c === "string" && ALLOWED_CATEGORIES.has(c))
      : [];
    // Status-guarded update prevents races with concurrent PATCH/decision requests.
    const updated = await db.update(iepEvaluations).set({
      status: "eligibility_determined",
      decisionEligible: decision,
      decisionCategories: cleanCategories,
      decisionRationale: body.rationale || null,
      decidedAt: new Date(),
      decidedByUserId: claims.sub,
      updatedAt: new Date(),
    }).where(and(eq(iepEvaluations.id, id), eq(iepEvaluations.status, "submitted"))).returning();
    if (updated.length === 0) {
      return reply.code(409).send({ error: "Evaluation status changed; please reload" });
    }
    return updated[0];
  });
}
