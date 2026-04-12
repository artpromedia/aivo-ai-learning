import { pgTable, uuid, varchar, timestamp, integer, jsonb, text } from "drizzle-orm/pg-core";
import { functioningLevelEnum } from "./enums";
import { users } from "./users";
import { tenants } from "./tenants";

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
