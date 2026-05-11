/**
 * Brain context normalization helper for tutor-svc.
 *
 * Mirrors the helper in learning-svc — both services need an identical
 * contract so the ai-svc receives a consistent learner profile no matter
 * which upstream service routed the call. Duplication is preferred over a
 * new shared workspace package because the two services have different
 * deployment cycles and the normalisation contract is small.
 */
import { createLogger } from "@aivo/observability";

const logger = createLogger("tutor-svc.brain-context");

export type BrainContextSourceShape = "context" | "state" | "direct" | "empty";

export interface NormalizedBrainContext {
  learner?: {
    id?: string;
    name?: string;
    gradeLevel?: string;
    grade_level?: string;
    communicationMode?: string;
    communication_mode?: string;
    diagnoses?: string[];
    curriculumFramework?: string;
    curriculum_framework?: string;
  };

  brainState?: Record<string, unknown>;
  brain_state?: Record<string, unknown>;

  functioningLevel?: string;
  functioning_level?: string;
  functioningLevelProfile?: Record<string, unknown>;
  functioning_level_profile?: Record<string, unknown>;

  activeAccommodations: string[];
  active_accommodations: string[];

  activeTutors: string[];
  active_tutors: string[];

  masteryLevels: Record<string, unknown>;
  mastery_levels: Record<string, unknown>;

  sensoryProfile?: Record<string, unknown>;
  sensory_profile?: Record<string, unknown>;

  iepProfile?: Record<string, unknown>;
  iep_profile?: Record<string, unknown>;

  iepGoals: Array<Record<string, unknown> | string>;
  iep_goals: Array<Record<string, unknown> | string>;

  languageProfile?: Record<string, unknown>;
  language_profile?: Record<string, unknown>;

  curriculumAlignment?: Record<string, unknown>;
  curriculum_alignment?: Record<string, unknown>;

  processProfile?: Record<string, unknown>;
  process_profile?: Record<string, unknown>;

  episodicMemory: unknown[];
  episodic_memory: unknown[];

  sourceShape: BrainContextSourceShape;
  profileCompleteness: {
    hasBrainState: boolean;
    hasFunctioningLevel: boolean;
    hasAccommodations: boolean;
    hasMastery: boolean;
    hasIep: boolean;
    hasSensory: boolean;
    hasLanguage: boolean;
    warnings: string[];
  };
}

function emptyNormalized(): NormalizedBrainContext {
  return {
    activeAccommodations: [],
    active_accommodations: [],
    activeTutors: [],
    active_tutors: [],
    masteryLevels: {},
    mastery_levels: {},
    iepGoals: [],
    iep_goals: [],
    episodicMemory: [],
    episodic_memory: [],
    sourceShape: "empty",
    profileCompleteness: {
      hasBrainState: false,
      hasFunctioningLevel: false,
      hasAccommodations: false,
      hasMastery: false,
      hasIep: false,
      hasSensory: false,
      hasLanguage: false,
      warnings: [],
    },
  };
}

function pick<T = unknown>(
  raw: Record<string, unknown>,
  ...keys: string[]
): T | undefined {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null) return raw[k] as T;
  }
  return undefined;
}

function tryParseJson<T>(value: unknown, fallback: T, warnings: string[], field: string): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as unknown as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    warnings.push(`json_parse_failed:${field}`);
    return fallback;
  }
}

function toStringArray(value: unknown, warnings: string[], field: string): string[] {
  const parsed = tryParseJson<unknown>(value, value, warnings, field);
  if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string");
  return [];
}

function toRecord(value: unknown, warnings: string[], field: string): Record<string, unknown> | undefined {
  const parsed = tryParseJson<unknown>(value, value, warnings, field);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return undefined;
}

function toArray(value: unknown, warnings: string[], field: string): unknown[] {
  const parsed = tryParseJson<unknown>(value, value, warnings, field);
  if (Array.isArray(parsed)) return parsed;
  return [];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function detectShape(raw: Record<string, unknown>): BrainContextSourceShape {
  if (
    isPlainObject(raw.brainState) ||
    Array.isArray(raw.iepGoals) ||
    isPlainObject(raw.functioningLevel) ||
    isPlainObject(raw.sensoryProfile)
  ) {
    return "context";
  }
  if (isPlainObject(raw.state)) return "state";
  return "direct";
}

export function normalizeBrainContext(raw: unknown): NormalizedBrainContext {
  if (!isPlainObject(raw)) return emptyNormalized();

  const shape = detectShape(raw);
  const warnings: string[] = [];

  let brainRecord: Record<string, unknown> = {};
  let topLevel: Record<string, unknown> = raw;

  if (shape === "context") {
    brainRecord = isPlainObject(raw.brainState) ? (raw.brainState as Record<string, unknown>) : {};
  } else if (shape === "state") {
    brainRecord = isPlainObject(raw.state) ? (raw.state as Record<string, unknown>) : {};
    topLevel = brainRecord;
  } else {
    brainRecord = raw;
  }

  const activeAccommodations = toStringArray(
    pick(brainRecord, "activeAccommodations", "active_accommodations") ??
      pick(topLevel, "activeAccommodations", "active_accommodations"),
    warnings,
    "active_accommodations",
  );

  const activeTutors = toStringArray(
    pick(brainRecord, "activeTutors", "active_tutors") ??
      pick(topLevel, "activeTutors", "active_tutors"),
    warnings,
    "active_tutors",
  );

  const masteryLevels =
    toRecord(
      pick(brainRecord, "masteryLevels", "mastery_levels") ??
        pick(topLevel, "masteryLevels", "mastery_levels"),
      warnings,
      "mastery_levels",
    ) || {};

  const sensoryProfile = toRecord(
    pick(topLevel, "sensoryProfile", "sensory_profile") ??
      pick(brainRecord, "sensoryProfile", "sensory_profile"),
    warnings,
    "sensory_profile",
  );

  const iepProfile = toRecord(
    pick(topLevel, "iepProfile", "iep_profile") ??
      pick(brainRecord, "iepProfile", "iep_profile"),
    warnings,
    "iep_profile",
  );

  const iepGoalsRaw =
    pick(topLevel, "iepGoals", "iep_goals") ??
    pick(brainRecord, "iepGoals", "iep_goals") ??
    (iepProfile?.goals as unknown);
  const iepGoals = toArray(iepGoalsRaw, warnings, "iep_goals") as Array<
    Record<string, unknown> | string
  >;

  const functioningLevelProfile = toRecord(
    pick(topLevel, "functioningLevel", "functioningLevelProfile", "functioning_level_profile") ??
      pick(brainRecord, "functioningLevelProfile", "functioning_level_profile"),
    warnings,
    "functioning_level_profile",
  );

  const flBrain = pick(brainRecord, "functioningLevel", "functioning_level");
  const flTop = pick(topLevel, "functioningLevel", "functioning_level");
  const flBrainValue = isPlainObject(flBrain) ? (flBrain.level as string | undefined) : (typeof flBrain === "string" ? flBrain : undefined);
  const flTopValue = isPlainObject(flTop) ? (flTop.level as string | undefined) : (typeof flTop === "string" ? flTop : undefined);
  const functioningLevel =
    flBrainValue ?? flTopValue ?? (functioningLevelProfile?.level as string | undefined);

  const languageProfile = toRecord(
    pick(topLevel, "languageProfile", "language_profile") ??
      pick(brainRecord, "languageProfile", "language_profile"),
    warnings,
    "language_profile",
  );

  const curriculumAlignment = toRecord(
    pick(brainRecord, "curriculumAlignment", "curriculum_alignment") ??
      pick(topLevel, "curriculumAlignment", "curriculum_alignment"),
    warnings,
    "curriculum_alignment",
  );

  const processProfile = toRecord(
    pick(brainRecord, "processProfile", "process_profile") ??
      pick(topLevel, "processProfile", "process_profile"),
    warnings,
    "process_profile",
  );

  const episodicMemory = toArray(
    pick(brainRecord, "episodicMemory", "episodic_memory") ??
      pick(topLevel, "episodicMemory", "episodic_memory"),
    warnings,
    "episodic_memory",
  );

  let learner: NormalizedBrainContext["learner"] | undefined;
  const learnerRaw = pick<Record<string, unknown>>(topLevel, "learner");
  if (isPlainObject(learnerRaw)) {
    const gradeLevel = learnerRaw.gradeLevel ?? learnerRaw.grade_level;
    const communicationMode = learnerRaw.communicationMode ?? learnerRaw.communication_mode;
    const curriculumFramework = learnerRaw.curriculumFramework ?? learnerRaw.curriculum_framework;
    learner = {
      id: typeof learnerRaw.id === "string" ? (learnerRaw.id as string) : undefined,
      name: typeof learnerRaw.name === "string" ? (learnerRaw.name as string) : undefined,
      gradeLevel: typeof gradeLevel === "string" ? gradeLevel : undefined,
      grade_level: typeof gradeLevel === "string" ? gradeLevel : undefined,
      communicationMode: typeof communicationMode === "string" ? communicationMode : undefined,
      communication_mode: typeof communicationMode === "string" ? communicationMode : undefined,
      diagnoses: Array.isArray(learnerRaw.diagnoses)
        ? (learnerRaw.diagnoses as unknown[]).filter((d): d is string => typeof d === "string")
        : undefined,
      curriculumFramework: typeof curriculumFramework === "string" ? curriculumFramework : undefined,
      curriculum_framework: typeof curriculumFramework === "string" ? curriculumFramework : undefined,
    };
  }

  const completeness = {
    hasBrainState: Object.keys(brainRecord).length > 0,
    hasFunctioningLevel: !!functioningLevel || !!functioningLevelProfile,
    hasAccommodations: activeAccommodations.length > 0,
    hasMastery: Object.keys(masteryLevels).length > 0,
    hasIep: !!iepProfile || iepGoals.length > 0,
    hasSensory: !!sensoryProfile,
    hasLanguage: !!languageProfile,
    warnings,
  };

  return {
    learner,
    brainState: brainRecord,
    brain_state: brainRecord,
    functioningLevel,
    functioning_level: functioningLevel,
    functioningLevelProfile,
    functioning_level_profile: functioningLevelProfile,
    activeAccommodations,
    active_accommodations: activeAccommodations,
    activeTutors,
    active_tutors: activeTutors,
    masteryLevels,
    mastery_levels: masteryLevels,
    sensoryProfile,
    sensory_profile: sensoryProfile,
    iepProfile,
    iep_profile: iepProfile,
    iepGoals,
    iep_goals: iepGoals,
    languageProfile,
    language_profile: languageProfile,
    curriculumAlignment,
    curriculum_alignment: curriculumAlignment,
    processProfile,
    process_profile: processProfile,
    episodicMemory,
    episodic_memory: episodicMemory,
    sourceShape: shape,
    profileCompleteness: completeness,
  };
}

const IS_PROD = process.env.NODE_ENV === "production";
function requireUrl(name: string, devDefault: string): string {
  const v = process.env[name];
  if (v) return v;
  if (IS_PROD) throw new Error(`tutor-svc: ${name} must be set in production`);
  return devDefault;
}
const BRAIN_SVC_URL = requireUrl("BRAIN_SVC_URL", "http://localhost:3002");

export async function fetchBrainContext(
  learnerId: string,
  opts: { service?: string } = {},
): Promise<NormalizedBrainContext> {
  const service = opts.service ?? "tutor-svc";
  let raw: unknown = null;
  try {
    const res = await fetch(`${BRAIN_SVC_URL}/api/brain/${learnerId}/context`);
    if (res.ok) {
      raw = await res.json();
    } else if (res.status !== 404) {
      logger.warn("brain_context_unexpected_status", { service, learnerId, status: res.status, path: "/context" });
    }
  } catch (err) {
    logger.warn("brain_context_fetch_failed", { service, learnerId, path: "/context", err: String(err) });
  }

  if (!raw) {
    try {
      const res = await fetch(`${BRAIN_SVC_URL}/api/brain/${learnerId}`);
      if (res.ok) {
        raw = await res.json();
      }
    } catch (err) {
      logger.warn("brain_context_fetch_failed", { service, learnerId, path: "/api/brain/{id}", err: String(err) });
    }
  }

  const normalized = normalizeBrainContext(raw);

  const completeness = normalized.profileCompleteness;
  const allMissing =
    !completeness.hasBrainState &&
    !completeness.hasFunctioningLevel &&
    !completeness.hasAccommodations &&
    !completeness.hasMastery;
  if (allMissing) {
    logger.warn("brain_context_missing", { service, learnerId, sourceShape: normalized.sourceShape });
  } else if (
    !completeness.hasFunctioningLevel ||
    !completeness.hasAccommodations ||
    !completeness.hasIep
  ) {
    logger.info("brain_context_partial", {
      service,
      learnerId,
      sourceShape: normalized.sourceShape,
      hasFunctioningLevel: completeness.hasFunctioningLevel,
      hasAccommodations: completeness.hasAccommodations,
      hasMastery: completeness.hasMastery,
      hasIep: completeness.hasIep,
      hasSensory: completeness.hasSensory,
      hasLanguage: completeness.hasLanguage,
    });
  } else {
    logger.info("brain_context_normalized", {
      service,
      learnerId,
      sourceShape: normalized.sourceShape,
    });
  }

  return normalized;
}
