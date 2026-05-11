/**
 * ProfiledStagePlan contract.
 *
 * Generated lessons must declare which learner-profile evidence informed
 * the plan and which adaptations were applied. The validator (see
 * stageplan-validator.ts) refuses a plan whose Brain context had
 * accommodations or IEP goals but which surfaces empty
 * `accommodationsApplied` / `profileAdaptationsApplied` — that's a sign
 * the AI ignored the learner profile.
 */
import type { NormalizedBrainContext } from "./brain-context.js";

export interface ProfileEvidenceFlags {
  functioningLevel: boolean;
  accommodations: boolean;
  mastery: boolean;
  iep: boolean;
  sensory: boolean;
  language: boolean;
  processProfile: boolean;
  curriculumAlignment: boolean;
}

export interface ProfiledStagePlan {
  id?: string;
  title: string;
  objective: string;
  subject: string;
  topic: string;
  gradeTarget?: string;
  deliveryLevel?: string;
  functioningLevel: string;
  profileAdaptationsApplied: string[];
  profileEvidenceUsed: ProfileEvidenceFlags;
  beats: unknown[];
  surfaces: Record<string, unknown>;
  masteryTargets?: string[];
  accommodationsApplied: string[];
  safetyChecks?: string[];
}

export function evidenceFromBrainContext(ctx: NormalizedBrainContext): ProfileEvidenceFlags {
  const c = ctx.profileCompleteness;
  return {
    functioningLevel: c.hasFunctioningLevel,
    accommodations: c.hasAccommodations,
    mastery: c.hasMastery,
    iep: c.hasIep,
    sensory: c.hasSensory,
    language: c.hasLanguage,
    processProfile: !!(ctx.processProfile || ctx.process_profile),
    curriculumAlignment: !!(ctx.curriculumAlignment || ctx.curriculum_alignment),
  };
}

const COMPUTATION_TOPIC_RE = /\b(add|subtract|multiply|divide|sum|difference|product|quotient|fraction|computation|arithmetic|operation)/i;
const GEOMETRY_TOPIC_RE = /\b(geometry|area|perimeter|rectangle|triangle|circle|polygon|angle|shape|volume)/i;

export function isGeometryTopic(subject?: string, topic?: string): boolean {
  return GEOMETRY_TOPIC_RE.test(`${subject ?? ""} ${topic ?? ""}`);
}

export function isComputationTopic(subject?: string, topic?: string): boolean {
  return COMPUTATION_TOPIC_RE.test(`${subject ?? ""} ${topic ?? ""}`);
}
