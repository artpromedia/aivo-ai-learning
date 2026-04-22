import { pgTable, uuid, varchar, timestamp, integer, jsonb, text, real, uniqueIndex } from "drizzle-orm/pg-core";
import { functioningLevelEnum } from "./enums.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";

export const learners = pgTable("learners", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  parentId: uuid("parent_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gradeLevel: varchar("grade_level", { length: 20 }),
  functioningLevel: functioningLevelEnum("functioning_level").default("STANDARD"),
  communicationMode: varchar("communication_mode", { length: 50 }),
  diagnoses: jsonb("diagnoses").default([]),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 10 }).default("US"),
  region: varchar("region", { length: 100 }),
  districtId: varchar("district_id", { length: 100 }),
  districtName: varchar("district_name", { length: 255 }),
  curriculumFramework: varchar("curriculum_framework", { length: 100 }),
  curriculumAlignment: jsonb("curriculum_alignment").default({}),
  schoolId: uuid("school_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sensoryProfiles = pgTable("sensory_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  visual: varchar("visual", { length: 20 }).default("typical"),
  auditory: varchar("auditory", { length: 20 }).default("typical"),
  tactile: varchar("tactile", { length: 20 }).default("typical"),
  vestibular: varchar("vestibular", { length: 20 }).default("typical"),
  proprioceptive: varchar("proprioceptive", { length: 20 }).default("typical"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const iepDocuments = pgTable("iep_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url"),
  parsedData: jsonb("parsed_data"),
  status: varchar("status", { length: 20 }).default("uploaded"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const iepProfiles = pgTable("iep_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  disabilityCategories: jsonb("disability_categories").default([]),
  accommodations: jsonb("accommodations").default([]),
  goals: jsonb("goals").default([]),
  gradeLevel: varchar("grade_level", { length: 20 }),
  communicationSystem: varchar("communication_system", { length: 100 }),
  assistiveTechnology: jsonb("assistive_technology").default([]),
  recommendedFunctioningLevel: functioningLevelEnum("recommended_functioning_level"),
  reviewDate: timestamp("review_date"),
  // Authoring lifecycle. `uploaded` rows come from PDF parse; `authored` rows are
  // drafted inside AIVO. Lifecycle moves draft → in_review → finalised → archived.
  source: varchar("source", { length: 20 }).default("uploaded").notNull(),
  lifecycleState: varchar("lifecycle_state", { length: 20 }).default("finalised").notNull(),
  authoredByUserId: uuid("authored_by_user_id").references(() => users.id),
  fromEvaluationId: uuid("from_evaluation_id"),
  // Set the first time a parent "in_review" notification is dispatched so
  // repeated notify-in-review calls don't spam the family.
  inReviewNotifiedAt: timestamp("in_review_notified_at"),
  placement: varchar("placement", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const iepPresentLevels = pgTable("iep_present_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  iepProfileId: uuid("iep_profile_id").references(() => iepProfiles.id).notNull(),
  area: varchar("area", { length: 30 }).notNull(),
  narrative: text("narrative"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const iepServices = pgTable("iep_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  iepProfileId: uuid("iep_profile_id").references(() => iepProfiles.id).notNull(),
  serviceType: varchar("service_type", { length: 60 }).notNull(),
  providerRole: varchar("provider_role", { length: 60 }),
  minutesPerWeek: integer("minutes_per_week"),
  frequency: varchar("frequency", { length: 60 }),
  location: varchar("location", { length: 60 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const iepGoals = pgTable("iep_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  iepProfileId: uuid("iep_profile_id").references(() => iepProfiles.id),
  goalText: text("goal_text").notNull(),
  domain: varchar("domain", { length: 100 }),
  baseline: varchar("baseline", { length: 255 }),
  targetCriteria: varchar("target_criteria", { length: 255 }),
  currentProgress: integer("current_progress").default(0),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const iepEvaluations = pgTable("iep_evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  initiatedByUserId: uuid("initiated_by_user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  referralReason: text("referral_reason"),
  assessmentAreas: jsonb("assessment_areas").default([]),
  observations: text("observations"),
  parentInput: text("parent_input"),
  aiSuggestion: jsonb("ai_suggestion"),
  decisionEligible: varchar("decision_eligible", { length: 20 }),
  decisionCategories: jsonb("decision_categories").default([]),
  decisionRationale: text("decision_rationale"),
  decidedAt: timestamp("decided_at"),
  decidedByUserId: uuid("decided_by_user_id").references(() => users.id),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const learnerFunctioningLevels = pgTable("learner_functioning_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  level: functioningLevelEnum("level").notNull(),
  determinedBy: varchar("determined_by", { length: 50 }).notNull(),
  parentSignals: jsonb("parent_signals").default({}),
  iepSignals: jsonb("iep_signals").default({}),
  confidence: integer("confidence").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transitionPlans = pgTable("transition_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  vocationalInterests: jsonb("vocational_interests").default([]),
  vocationalAptitude: jsonb("vocational_aptitude").default({}),
  independentLiving: jsonb("independent_living").default({}),
  communityParticipation: jsonb("community_participation").default({}),
  selfAdvocacy: jsonb("self_advocacy").default({}),
  postSecondaryPlanning: jsonb("post_secondary_planning").default({}),
  annualGoals: jsonb("annual_goals").default([]),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  startAge: integer("start_age"),
  lastReviewDate: timestamp("last_review_date"),
  nextReviewDate: timestamp("next_review_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const languageProfiles = pgTable("language_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  primaryLanguage: varchar("primary_language", { length: 50 }).notNull(),
  secondaryLanguages: jsonb("secondary_languages").default([]),
  dominanceByDomain: jsonb("dominance_by_domain").default({}),
  processingSpeed: jsonb("processing_speed").default({}),
  codeSwitchingFrequency: real("code_switching_frequency"),
  preferredInstructionLanguage: varchar("preferred_instruction_language", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Phase C: IEP team collaboration & e-signatures.
export const iepTeamMembers = pgTable("iep_team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  iepProfileId: uuid("iep_profile_id").references(() => iepProfiles.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 30 }).notNull(),
  addedBy: uuid("added_by").references(() => users.id).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (t) => ({
  unique: uniqueIndex("iep_team_members_profile_user_role_uidx")
    .on(t.iepProfileId, t.userId, t.role),
}));

export const iepComments = pgTable("iep_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  iepProfileId: uuid("iep_profile_id").references(() => iepProfiles.id).notNull(),
  section: varchar("section", { length: 30 }).notNull(),
  goalId: uuid("goal_id"),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  body: text("body").notNull(),
  mentions: jsonb("mentions").default([]),
  parentCommentId: uuid("parent_comment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const iepRevisions = pgTable("iep_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  iepProfileId: uuid("iep_profile_id").references(() => iepProfiles.id).notNull(),
  section: varchar("section", { length: 30 }).notNull(),
  snapshot: jsonb("snapshot").notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const iepSignatures = pgTable("iep_signatures", {
  id: uuid("id").defaultRandom().primaryKey(),
  iepProfileId: uuid("iep_profile_id").references(() => iepProfiles.id).notNull(),
  signerUserId: uuid("signer_user_id").references(() => users.id).notNull(),
  signerRole: varchar("signer_role", { length: 30 }).notNull(),
  typedName: varchar("typed_name", { length: 255 }).notNull(),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
  ipHash: varchar("ip_hash", { length: 64 }),
  status: varchar("status", { length: 20 }).default("signed").notNull(),
}, (t) => ({
  // One active signature per (profile, user, role) — guards against duplicate
  // signs racing past the in-app idempotency check.
  unique: uniqueIndex("iep_signatures_profile_user_role_uidx")
    .on(t.iepProfileId, t.signerUserId, t.signerRole),
}));

