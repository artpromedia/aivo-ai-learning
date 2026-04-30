/**
 * Generic tutor-session route — drives any catalog tutor through the
 * shared `@aivo/tutor-runtime` planner.
 *
 * `POST /api/tutors/:tutorKey/plan`
 *   Body:
 *     {
 *       learnerId: string,
 *       functioningLevel?: string,
 *       learnerAgeYears?: number,
 *       consentRecordId?: string,
 *       contentPack: ContentPack,
 *       masteryRecords?: MasteryRecord[],
 *       recentOutcomes?: AnswerOutcome[],
 *       recentlyCovered?: string[],
 *       interestProfile?: LearnerInterestProfile,
 *       maxActivities?: number
 *     }
 *   Returns:
 *     SessionPlan from `@aivo/tutor-runtime`.
 *
 * The pack is supplied in the body for now — the curriculum/CMS work
 * (Phase 4 of the rollout) will move pack loading server-side. Keeping
 * the interface push-based unblocks every downstream surface (web,
 * mobile, parent dashboards) without waiting on the CMS.
 *
 * The route is intentionally generic: every tutor in `TUTOR_REGISTRY`
 * is reachable through the same handler. Tutor-specific specialisation
 * (Speech Buddy's full audio loop, Pixel's `code_run` tool, Vigor's
 * DAPE branch, Compass's transition module) lives downstream and rides
 * the persona key the registry already exposes.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  planSession,
  checkPolicy,
  TutorPolicyError,
  type LearnerContext,
  type SessionPlan,
} from "@aivo/tutor-runtime";
import type { ContentPack } from "@aivo/content-pack";
import type { MasteryRecord, AnswerOutcome } from "@aivo/pedagogy";
import type { LearnerInterestProfile } from "@aivo/special-interest-engine";
import { getTutorDefinition, listTutorDefinitions } from "../modes/registry.js";
import {
  buildLearnerContext,
  negotiateFunctioningLevel,
} from "../lib/learnerContext.js";

interface PlanBody {
  learnerId?: string;
  functioningLevel?: string;
  learnerAgeYears?: number;
  consentRecordId?: string;
  contentPack?: ContentPack;
  masteryRecords?: MasteryRecord[];
  recentOutcomes?: AnswerOutcome[];
  recentlyCovered?: string[];
  interestProfile?: LearnerInterestProfile;
  maxActivities?: number;
}

interface PlanResponse extends SessionPlan {
  /** Persona key from `tutor_personas.py` for the ai-svc chat handoff. */
  aiSvcPersonaKey?: string;
  /** The TutorDefinition id that produced this plan (for replay). */
  tutorDefinitionId: string;
}

export function registerTutorSessionRoutes(app: FastifyInstance): void {
  // ── GET /api/tutors ────────────────────────────────────────────────
  // Lightweight catalog endpoint so the UI / admin can verify which
  // tutors the runtime knows about and what they support.
  app.get("/api/tutors", async () => {
    return {
      tutors: listTutorDefinitions().map(([key, def]) => ({
        key,
        id: def.id,
        persona: def.persona,
        subjects: def.subjects,
        gradeBands: def.gradeBands,
        functioningLevels: def.functioningLevels,
        capabilities: def.capabilities,
        skillGraphRefs: def.skillGraphRefs,
        defaultContentPackRefs: def.defaultContentPackRefs,
        policy: def.policy,
        aiSvcPersonaKey: def.authoringMeta?.aiSvcPersonaKey,
      })),
    };
  });

  // ── GET /api/tutors/:tutorKey ─────────────────────────────────────
  app.get<{ Params: { tutorKey: string } }>(
    "/api/tutors/:tutorKey",
    async (req: FastifyRequest<{ Params: { tutorKey: string } }>, reply: FastifyReply) => {
      const def = getTutorDefinition(req.params.tutorKey);
      if (!def) {
        return reply.code(404).send({ error: `unknown tutor "${req.params.tutorKey}"` });
      }
      return def;
    },
  );

  // ── POST /api/tutors/:tutorKey/plan ───────────────────────────────
  app.post<{ Params: { tutorKey: string }; Body: PlanBody }>(
    "/api/tutors/:tutorKey/plan",
    async (
      req: FastifyRequest<{ Params: { tutorKey: string }; Body: PlanBody }>,
      reply: FastifyReply,
    ) => {
      const { tutorKey } = req.params;
      const def = getTutorDefinition(tutorKey);
      if (!def) {
        return reply.code(404).send({ error: `unknown tutor "${tutorKey}"` });
      }

      const body: PlanBody = req.body ?? {};
      if (!body.learnerId) {
        return reply.code(400).send({ error: "learnerId is required" });
      }
      if (!body.contentPack || !Array.isArray(body.contentPack.activities)) {
        return reply
          .code(400)
          .send({ error: "contentPack with activities[] is required" });
      }

      // Policy gates first — fail fast before we build context.
      try {
        checkPolicy(def, {
          consentRecordId: body.consentRecordId,
          learnerAgeYears: body.learnerAgeYears,
        });
      } catch (err) {
        if (err instanceof TutorPolicyError) {
          const status = err.code === "consent_missing" ? 403 : 400;
          return reply.code(status).send({ error: err.message, code: err.code });
        }
        throw err;
      }

      // Negotiate a supported functioning level — this lets the runtime
      // serve a learner whose nominal level isn't on the tutor's list,
      // by stepping toward the most-supportive level the tutor offers.
      const baseCtx: LearnerContext = buildLearnerContext({
        learnerId: body.learnerId,
        functioningLevel: body.functioningLevel,
        masteryRecords: body.masteryRecords,
        recentOutcomes: body.recentOutcomes,
        recentlyCovered: body.recentlyCovered,
        interestProfile: body.interestProfile,
      });
      const negotiated = negotiateFunctioningLevel(baseCtx.functioningLevel, def);
      if (!negotiated) {
        return reply.code(400).send({
          error: `tutor ${def.id} declares no supported functioning levels`,
        });
      }
      const ctx: LearnerContext = { ...baseCtx, functioningLevel: negotiated };

      try {
        const plan = planSession(def, ctx, body.contentPack, {
          maxActivities: body.maxActivities,
        });
        const response: PlanResponse = {
          ...plan,
          tutorDefinitionId: def.id,
          aiSvcPersonaKey: def.authoringMeta?.aiSvcPersonaKey,
        };
        return response;
      } catch (err) {
        if (err instanceof TutorPolicyError) {
          return reply.code(400).send({ error: err.message, code: err.code });
        }
        const message = err instanceof Error ? err.message : String(err);
        req.log?.error?.({ err }, "tutor.plan_failed");
        return reply.code(500).send({ error: "plan failed", detail: message });
      }
    },
  );
}
