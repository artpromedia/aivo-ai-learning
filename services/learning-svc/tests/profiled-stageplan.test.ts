/**
 * Tests for the profile-evidence StagePlan gates.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateStagePlan } from "../src/services/stageplan-validator.js";

const validGeometrySurface = {
  id: "surf-geo-1",
  type: "geometry_workspace",
  prompt: "Find the area",
  diagram: { canvasMode: "svg", shapes: [{ id: "rect1", kind: "rectangle", x: 0, y: 0, width: 320, height: 180 }] },
  capture: { finalAnswer: true, inkStrokes: true },
  scoring: { mode: "exact", correctAnswer: 32 },
  accessibility: { altText: "rect", reduceMotionSafe: true, keyboardAlternative: true },
  scratchpad: { enabled: true },
};

const validScratchpadSurface = {
  id: "surf-scratch-1",
  type: "scratchpad",
  prompt: "Show your work",
  scratchpad: { enabled: true },
  capture: { inkStrokes: true },
  accessibility: { altText: "scratchpad" },
};

function basePlan(extra: Record<string, unknown> = {}) {
  return {
    id: "plan-1",
    title: "Geometry",
    objective: "Find the area",
    subject: "math",
    topic: "geometry.area_rectangle",
    beats: [
      { id: "b1", type: "narration", narration: "Today." },
      { id: "b2", type: "interaction", surfaceId: "surf-geo-1" },
    ],
    surfaces: { "surf-geo-1": validGeometrySurface },
    masteryTargets: [],
    accommodationsApplied: [],
    safetyChecks: [],
    ...extra,
  };
}

test("rejects geometry topic missing geometry_workspace", () => {
  const plan = basePlan({
    surfaces: {},
    beats: [{ id: "b1", type: "narration", narration: "x" }],
  });
  const r = validateStagePlan(plan, { subject: "math", topic: "geometry.area" });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.code === "geometry_missing_geometry_workspace"));
});

test("rejects computation topic missing scratchpad", () => {
  const plan = basePlan({
    topic: "math.multiplication",
    surfaces: {},
    beats: [{ id: "b1", type: "narration", narration: "x" }],
  });
  const r = validateStagePlan(plan, { subject: "math", topic: "multiplication" });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.code === "computation_missing_scratchpad"));
});

test("accepts computation plan with a scratchpad surface", () => {
  const plan = basePlan({
    topic: "math.multiplication",
    surfaces: { "surf-scratch-1": validScratchpadSurface },
    beats: [
      { id: "b1", type: "narration", narration: "Today." },
      { id: "b2", type: "interaction", surfaceId: "surf-scratch-1" },
    ],
  });
  const r = validateStagePlan(plan, { subject: "math", topic: "multiplication" });
  assert.equal(r.valid, true, JSON.stringify(r.issues));
});

test("rejects when Brain had accommodations but plan applies none", () => {
  const plan = basePlan({ accommodationsApplied: [] });
  const r = validateStagePlan(plan, {
    subject: "math",
    topic: "geometry.area",
    brainHadAccommodations: true,
  });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.code === "accommodations_not_applied"));
});

test("rejects empty profileAdaptationsApplied when declared", () => {
  const plan = basePlan({ profileAdaptationsApplied: [] });
  const r = validateStagePlan(plan, { subject: "math", topic: "geometry.area" });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.code === "profile_adaptations_empty"));
});

test("rejects NON_VERBAL plan that requires speech", () => {
  const plan = basePlan({
    beats: [
      { id: "b1", type: "narration", narration: "x" },
      { id: "b2", type: "interaction", surfaceId: "surf-geo-1", interaction: { responseMode: "spoken" } },
    ],
  });
  const r = validateStagePlan(plan, {
    subject: "math",
    topic: "geometry.area",
    functioningLevel: "NON_VERBAL",
  });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.code === "non_verbal_requires_speech"));
});

test("references IEP goals when brain had them on file", () => {
  const planWithoutIep = basePlan({ accommodationsApplied: ["scratchpad"] });
  const r1 = validateStagePlan(planWithoutIep, {
    subject: "math",
    topic: "geometry.area",
    brainHadIep: true,
  });
  assert.equal(r1.valid, false);
  assert.ok(r1.issues.some((i) => i.code === "iep_goals_not_referenced"));

  const planWithIep = basePlan({
    accommodationsApplied: ["scratchpad"],
    profileAdaptationsApplied: ["iep_goal_alternative_response"],
  });
  const r2 = validateStagePlan(planWithIep, {
    subject: "math",
    topic: "geometry.area",
    brainHadIep: true,
  });
  assert.ok(!r2.issues.some((i) => i.code === "iep_goals_not_referenced"));
});
