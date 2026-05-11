/**
 * StagePlan validator. Generated lessons that fail validation must
 * never be served to learners — quality gate failures return a 422
 * from the lesson session route so the client can re-request or
 * surface a recoverable error.
 *
 * This module is pure (no IO) so it can be exercised in unit tests
 * without booting Fastify.
 */

export type StagePlanQualityIssue = {
  code: string;
  detail: string;
};

export interface StagePlanValidationResult {
  valid: boolean;
  issues: StagePlanQualityIssue[];
}

const HTML_TAG_RE = /<\s*[a-z!][^>]*>/i;
const SCRIPT_TAG_RE = /<\s*script\b/i;

const SUPPORTED_LEGACY_INTERACTIONS = new Set([
  "multiple_choice",
  "drag_drop",
  "voice",
  "tap",
  "match",
  "draw",
  "scratchpad",
  "geometry_workspace",
  "math_expression",
]);

function checkText(text: unknown, where: string, issues: StagePlanQualityIssue[]) {
  if (typeof text !== "string") return;
  if (SCRIPT_TAG_RE.test(text)) issues.push({ code: "script_tag", detail: where });
  if (HTML_TAG_RE.test(text)) issues.push({ code: "raw_html", detail: where });
}

export interface StagePlanValidationOptions {
  functioningLevel?: string;
  /** Subject/topic used to enforce geometry-needs-geometry_workspace and
   * computation-needs-scratchpad rules. */
  subject?: string;
  topic?: string;
  /** When true, the upstream Brain context had accommodations on file;
   * the generated plan must surface a non-empty `accommodationsApplied`. */
  brainHadAccommodations?: boolean;
  /** When true, the upstream Brain context had IEP goals; the plan must
   * either reference them or explicitly note them in the safety checks. */
  brainHadIep?: boolean;
}

export function validateStagePlan(plan: any, opts?: StagePlanValidationOptions): StagePlanValidationResult {
  const issues: StagePlanQualityIssue[] = [];

  if (!plan || typeof plan !== "object") {
    return { valid: false, issues: [{ code: "not_object", detail: "stageplan" }] };
  }

  if (!plan.title || typeof plan.title !== "string") issues.push({ code: "missing_title", detail: "title" });
  if (!plan.objective || typeof plan.objective !== "string") issues.push({ code: "missing_objective", detail: "objective" });
  if (!Array.isArray(plan.beats) || plan.beats.length === 0) {
    issues.push({ code: "missing_beats", detail: "beats" });
  }

  checkText(plan.title, "title", issues);
  checkText(plan.objective, "objective", issues);

  const seenBeatIds = new Set<string>();
  const seenSurfaceIds = new Set<string>();

  const surfaces: Record<string, any> = (plan.surfaces && typeof plan.surfaces === "object") ? plan.surfaces : {};
  for (const [id, surface] of Object.entries(surfaces)) {
    if (seenSurfaceIds.has(id)) issues.push({ code: "duplicate_surface_id", detail: id });
    seenSurfaceIds.add(id);
    if (!surface || typeof surface !== "object") {
      issues.push({ code: "invalid_surface", detail: id });
      continue;
    }
    if (!(surface as any).accessibility?.altText) {
      issues.push({ code: "surface_missing_alt_text", detail: id });
    }
    if ((surface as any).type === "geometry_workspace") {
      const shapes = (surface as any).diagram?.shapes;
      if (!Array.isArray(shapes) || shapes.length === 0) {
        issues.push({ code: "geometry_missing_shapes", detail: id });
      }
    }
    if ((surface as any).scratchpad?.enabled && (surface as any).capture?.inkStrokes !== true) {
      issues.push({ code: "scratchpad_missing_ink_capture", detail: id });
    }
  }

  for (const beat of plan.beats || []) {
    if (!beat || typeof beat !== "object") {
      issues.push({ code: "invalid_beat", detail: "non_object_beat" });
      continue;
    }
    if (!beat.id) issues.push({ code: "beat_missing_id", detail: "beat_missing_id" });
    if (beat.id) {
      if (seenBeatIds.has(beat.id)) issues.push({ code: "duplicate_beat_id", detail: beat.id });
      seenBeatIds.add(beat.id);
    }
    checkText(beat.narration, `beat:${beat.id}:narration`, issues);

    if (beat.surfaceId && !surfaces[beat.surfaceId]) {
      issues.push({ code: "unresolved_surface_id", detail: `${beat.id} -> ${beat.surfaceId}` });
    }

    if (beat.type === "interaction") {
      const hasSurface = beat.surface || (beat.surfaceId && surfaces[beat.surfaceId]);
      const legacyType = beat.interaction?.type;
      if (!hasSurface && (!legacyType || !SUPPORTED_LEGACY_INTERACTIONS.has(legacyType))) {
        issues.push({ code: "interaction_without_surface_or_legacy_type", detail: beat.id ?? "" });
      }
    }
  }

  // Functioning-level guards.
  const fl = opts?.functioningLevel;
  if (fl === "LOW_VERBAL" || fl === "NON_VERBAL" || fl === "PRE_SYMBOLIC") {
    for (const beat of plan.beats || []) {
      if (typeof beat?.narration === "string" && beat.narration.length > 240) {
        issues.push({ code: "narration_too_long_for_low_verbal", detail: beat.id ?? "" });
      }
    }
  }
  if (fl === "NON_VERBAL") {
    for (const beat of plan.beats || []) {
      const reqMode = beat?.interaction?.responseMode ?? beat?.expectedResponse ?? "";
      if (typeof reqMode === "string" && /speech|spoken|voice/i.test(reqMode)) {
        issues.push({ code: "non_verbal_requires_speech", detail: beat.id ?? "" });
      }
    }
  }
  if (fl === "PRE_SYMBOLIC") {
    for (const beat of plan.beats || []) {
      const hasVisual = !!(beat?.surfaceId || beat?.surface || beat?.interaction?.media);
      if (typeof beat?.narration === "string" && beat.narration.length > 80 && !hasVisual) {
        issues.push({ code: "pre_symbolic_text_only_abstract", detail: beat.id ?? "" });
      }
    }
  }

  // Profile evidence guards. The generator's prompt requires
  // `profileAdaptationsApplied` and `profileEvidenceUsed`; refuse to
  // serve a plan whose Brain context had accommodations or IEP goals
  // on file but which surface no adaptation marker.
  const subject: string | undefined = plan.subject ?? opts?.subject;
  const topic: string | undefined = plan.topic ?? opts?.topic;

  const adaptations = plan.profileAdaptationsApplied;
  const evidence = plan.profileEvidenceUsed;
  if (adaptations !== undefined) {
    if (!Array.isArray(adaptations) || adaptations.length === 0) {
      issues.push({ code: "profile_adaptations_empty", detail: "profileAdaptationsApplied" });
    }
  }
  if (evidence !== undefined && (typeof evidence !== "object" || evidence === null)) {
    issues.push({ code: "profile_evidence_missing", detail: "profileEvidenceUsed" });
  }

  if (opts?.brainHadAccommodations) {
    const applied = plan.accommodationsApplied;
    if (!Array.isArray(applied) || applied.length === 0) {
      issues.push({ code: "accommodations_not_applied", detail: "accommodationsApplied" });
    }
  }
  if (opts?.brainHadIep) {
    const applied = plan.accommodationsApplied || [];
    const checks = plan.safetyChecks || [];
    const adaptList = plan.profileAdaptationsApplied || [];
    const referenced = [...applied, ...checks, ...adaptList].some(
      (v: unknown) => typeof v === "string" && /iep|goal/i.test(v),
    );
    if (!referenced) {
      issues.push({ code: "iep_goals_not_referenced", detail: "profileAdaptationsApplied|safetyChecks" });
    }
  }

  // Subject-required surfaces.
  const surfaceTypes = new Set<string>(
    Object.values(surfaces)
      .map((s: any) => (typeof s?.type === "string" ? s.type : ""))
      .filter(Boolean),
  );
  const haystack = `${subject ?? ""} ${topic ?? ""}`;
  if (/\b(geometry|area|perimeter|rectangle|triangle|polygon|angle|shape)\b/i.test(haystack)) {
    if (!surfaceTypes.has("geometry_workspace")) {
      issues.push({ code: "geometry_missing_geometry_workspace", detail: haystack.trim() });
    }
  }
  if (/(add(ition)?|subtract(ion)?|multipl(y|ication)|divi(de|sion)|sum|product|quotient|fraction|computation|arithmetic)/i.test(haystack)) {
    if (!surfaceTypes.has("scratchpad") && !surfaceTypes.has("math_expression")) {
      issues.push({ code: "computation_missing_scratchpad", detail: haystack.trim() });
    }
  }

  return { valid: issues.length === 0, issues };
}
