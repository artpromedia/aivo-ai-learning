/**
 * Tests for the learning-svc brain context normaliser.
 *
 * Run with: pnpm --filter @aivo/learning-svc test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeBrainContext } from "../src/services/brain-context.js";

test("returns empty NormalizedBrainContext for null", () => {
  const n = normalizeBrainContext(null);
  assert.equal(n.sourceShape, "empty");
  assert.deepEqual(n.activeAccommodations, []);
  assert.deepEqual(n.mastery_levels, {});
});

test("returns empty NormalizedBrainContext for non-object input", () => {
  const n = normalizeBrainContext("not-an-object");
  assert.equal(n.sourceShape, "empty");
});

test("extracts state envelope: { state: {...} }", () => {
  const n = normalizeBrainContext({
    state: {
      active_accommodations: ["scratchpad", "extended_time"],
      mastery_levels: { "math.geometry.area": 0.3 },
    },
  });
  assert.equal(n.sourceShape, "state");
  assert.deepEqual(n.activeAccommodations, ["scratchpad", "extended_time"]);
  assert.equal(n.masteryLevels["math.geometry.area"], 0.3);
});

test("normalises direct brain record camelCase to snake_case keys", () => {
  const n = normalizeBrainContext({
    activeAccommodations: ["picture_supports"],
    masteryLevels: { "math.addition": 0.5 },
    activeTutors: ["nova"],
  });
  assert.equal(n.sourceShape, "direct");
  // both casings populated
  assert.deepEqual(n.activeAccommodations, ["picture_supports"]);
  assert.deepEqual(n.active_accommodations, ["picture_supports"]);
  assert.equal(n.mastery_levels["math.addition"], 0.5);
  assert.deepEqual(n.activeTutors, ["nova"]);
});

test("does not lose context when caller hits direct /api/brain/{id}", () => {
  // Reproduces the original bug: previously data.state || {} would
  // return {} for the direct brain record (which has no `state` key).
  const direct = {
    masteryLevels: { x: 0.9 },
    activeAccommodations: ["picture_supports"],
  };
  const n = normalizeBrainContext(direct);
  assert.notEqual(Object.keys(n.brainState ?? {}).length, 0);
  assert.equal(n.profileCompleteness.hasAccommodations, true);
});

test("extracts /context response with brainState + iepGoals", () => {
  const n = normalizeBrainContext({
    learner: { id: "L1", name: "X", gradeLevel: "5", communicationMode: "choice_touch" },
    brainState: {
      activeAccommodations: ["scratchpad"],
      masteryLevels: { "math.geometry.area": 0.35 },
    },
    sensoryProfile: { visual: "typical", auditory: "hyper" },
    iepGoals: ["Solve visual math problems"],
    functioningLevel: { level: "LOW_VERBAL", deliveryLevel: "SECOND" },
    languageProfile: { dominant_language: "English" },
  });
  assert.equal(n.sourceShape, "context");
  assert.equal(n.learner?.gradeLevel, "5");
  assert.equal(n.learner?.grade_level, "5");
  assert.equal(n.functioningLevel, "LOW_VERBAL");
  assert.deepEqual(n.activeAccommodations, ["scratchpad"]);
  assert.equal(n.masteryLevels["math.geometry.area"], 0.35);
  assert.equal((n.sensoryProfile as any)?.auditory, "hyper");
  assert.deepEqual(n.iepGoals, ["Solve visual math problems"]);
});

test("JSON-encoded array fields parse safely", () => {
  const n = normalizeBrainContext({
    active_accommodations: JSON.stringify(["scratchpad", "extended_time"]),
  });
  assert.deepEqual(n.activeAccommodations, ["scratchpad", "extended_time"]);
});

test("malformed JSON does not crash", () => {
  const n = normalizeBrainContext({
    active_accommodations: "{this-is-not-json",
  });
  assert.deepEqual(n.activeAccommodations, []);
  assert.ok(
    n.profileCompleteness.warnings.some((w) => w.startsWith("json_parse_failed:")),
  );
});

test("profileCompleteness flags reflect populated fields", () => {
  const n = normalizeBrainContext({
    activeAccommodations: ["picture_supports"],
    masteryLevels: { k: 0.4 },
    iepProfile: { goals: ["a goal"] },
    sensoryProfile: { visual: "hyper" },
    languageProfile: { dominant_language: "en" },
    functioningLevel: "LOW_VERBAL",
  });
  assert.equal(n.profileCompleteness.hasAccommodations, true);
  assert.equal(n.profileCompleteness.hasMastery, true);
  assert.equal(n.profileCompleteness.hasIep, true);
  assert.equal(n.profileCompleteness.hasSensory, true);
  assert.equal(n.profileCompleteness.hasLanguage, true);
  assert.equal(n.profileCompleteness.hasFunctioningLevel, true);
});

test("learning-svc no longer returns {} for direct brain record (regression)", () => {
  // Previously fetchBrainContext returned data.state || {}, which is {}
  // when the brain-svc returned the brain record at the top level.
  const direct = {
    activeAccommodations: ["scratchpad"],
    masteryLevels: { "math.addition": 0.7 },
    activeTutors: ["nova"],
  };
  const n = normalizeBrainContext(direct);
  assert.equal(n.profileCompleteness.hasBrainState, true);
  assert.equal(n.profileCompleteness.hasAccommodations, true);
});
