import { pgTable, uuid, varchar, timestamp, integer, jsonb, text, real } from "drizzle-orm/pg-core";
import { assessmentModeEnum, assessmentStatusEnum } from "./enums";
import { learners } from "./learners";
import { tenants } from "./tenants";

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  mode: assessmentModeEnum("mode").notNull().default("STANDARD"),
  status: assessmentStatusEnum("status").notNull().default("NOT_STARTED"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  domainScores: jsonb("domain_scores").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assessmentResponses = pgTable("assessment_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").references(() => assessmentAttempts.id).notNull(),
  questionId: varchar("question_id", { length: 100 }).notNull(),
  domain: varchar("domain", { length: 100 }),
  response: jsonb("response").notNull(),
  correct: integer("correct"),
  responseTimeMs: integer("response_time_ms"),
  confidence: real("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parentAssessments = pgTable("parent_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  communicationMode: varchar("communication_mode", { length: 50 }),
  deviceInteraction: varchar("device_interaction", { length: 50 }),
  responseMethod: varchar("response_method", { length: 50 }),
  attentionSpan: varchar("attention_span", { length: 50 }),
  diagnoses: jsonb("diagnoses").default([]),
  responses: jsonb("responses").default({}),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const observationalAssessments = pgTable("observational_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").references(() => assessmentAttempts.id).notNull(),
  observerId: uuid("observer_id"),
  checklist: jsonb("checklist").default({}),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
