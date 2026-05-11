import type { TenantRole } from "./tenant-context.js";

const READ_LEARNER_PROFILE_ROLES = new Set<TenantRole>([
  "learner",
  "parent",
  "teacher",
  "school_admin",
  "district_admin",
  "platform_admin",
  "service",
]);

const MUTATE_LEARNER_PROFILE_ROLES = new Set<TenantRole>(["parent", "service"]);

const APPROVE_PROFILE_RECOMMENDATION_ROLES = new Set<TenantRole>(["parent"]);

const VIEW_DISTRICT_ANALYTICS_ROLES = new Set<TenantRole>([
  "school_admin",
  "district_admin",
  "platform_admin",
]);

const VIEW_AGGREGATE_BUT_NOT_PRIVATE_NOTES = new Set<TenantRole>([
  "school_admin",
  "district_admin",
]);

const SUBMIT_TEACHER_OBSERVATION_ROLES = new Set<TenantRole>(["teacher"]);

const MUTATE_BRAIN_GOVERNANCE_FIELDS = new Set<TenantRole>(["parent", "service"]);

export function canReadLearnerProfile(role: TenantRole | undefined): boolean {
  if (!role) return false;
  return READ_LEARNER_PROFILE_ROLES.has(role);
}

export function canMutateLearnerProfile(role: TenantRole | undefined): boolean {
  if (!role) return false;
  return MUTATE_LEARNER_PROFILE_ROLES.has(role);
}

export function canApproveProfileRecommendation(role: TenantRole | undefined): boolean {
  if (!role) return false;
  return APPROVE_PROFILE_RECOMMENDATION_ROLES.has(role);
}

export function canViewDistrictAnalytics(role: TenantRole | undefined): boolean {
  if (!role) return false;
  return VIEW_DISTRICT_ANALYTICS_ROLES.has(role);
}

export function canReadParentPrivateNotes(role: TenantRole | undefined): boolean {
  if (!role) return false;
  if (role === "parent" || role === "platform_admin") {
    return true;
  }
  return !VIEW_AGGREGATE_BUT_NOT_PRIVATE_NOTES.has(role);
}

export function canSubmitTeacherObservation(role: TenantRole | undefined): boolean {
  if (!role) return false;
  return SUBMIT_TEACHER_OBSERVATION_ROLES.has(role);
}

export function canMutateBrainGovernanceFields(role: TenantRole | undefined): boolean {
  if (!role) return false;
  return MUTATE_BRAIN_GOVERNANCE_FIELDS.has(role);
}
