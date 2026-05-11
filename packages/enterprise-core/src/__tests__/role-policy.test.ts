import { describe, expect, it } from "vitest";
import {
  canApproveProfileRecommendation,
  canMutateBrainGovernanceFields,
  canMutateLearnerProfile,
  canReadLearnerProfile,
  canReadParentPrivateNotes,
  canSubmitTeacherObservation,
  canViewDistrictAnalytics,
} from "../role-policy.js";

describe("role policy", () => {
  it("parent can approve profile recommendations", () => {
    expect(canApproveProfileRecommendation("parent")).toBe(true);
  });

  it("teacher cannot approve profile recommendations", () => {
    expect(canApproveProfileRecommendation("teacher")).toBe(false);
  });

  it("district admin cannot approve profile recommendations", () => {
    expect(canApproveProfileRecommendation("district_admin")).toBe(false);
  });

  it("district admin cannot mutate learner profile", () => {
    expect(canMutateLearnerProfile("district_admin")).toBe(false);
  });

  it("teacher can submit observations", () => {
    expect(canSubmitTeacherObservation("teacher")).toBe(true);
  });

  it("teacher cannot mutate brain governance fields", () => {
    expect(canMutateBrainGovernanceFields("teacher")).toBe(false);
  });

  it("parent can mutate brain governance fields", () => {
    expect(canMutateBrainGovernanceFields("parent")).toBe(true);
  });

  it("learner cannot mutate brain governance fields", () => {
    expect(canMutateBrainGovernanceFields("learner")).toBe(false);
  });

  it("district admin can view district analytics", () => {
    expect(canViewDistrictAnalytics("district_admin")).toBe(true);
  });

  it("learner cannot view district analytics", () => {
    expect(canViewDistrictAnalytics("learner")).toBe(false);
  });

  it("district admin cannot read parent private notes", () => {
    expect(canReadParentPrivateNotes("district_admin")).toBe(false);
  });

  it("school admin cannot read parent private notes", () => {
    expect(canReadParentPrivateNotes("school_admin")).toBe(false);
  });

  it("parent can read parent private notes", () => {
    expect(canReadParentPrivateNotes("parent")).toBe(true);
  });

  it("returns false when role is undefined", () => {
    expect(canReadLearnerProfile(undefined)).toBe(false);
    expect(canApproveProfileRecommendation(undefined)).toBe(false);
    expect(canMutateLearnerProfile(undefined)).toBe(false);
  });
});
