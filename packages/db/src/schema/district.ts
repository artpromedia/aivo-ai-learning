import { pgTable, uuid, varchar, timestamp, jsonb, text, integer, index, uniqueIndex, date } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";
import { learners } from "./learners";

export const schools = pgTable("schools", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  principalName: varchar("principal_name", { length: 255 }),
  principalEmail: varchar("principal_email", { length: 255 }),
  enrollmentCapacity: integer("enrollment_capacity"),
  gradeLevels: jsonb("grade_levels").default([]),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_schools_tenant").on(table.tenantId),
]);

export const classrooms = pgTable("classrooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  gradeLevel: varchar("grade_level", { length: 20 }),
  subject: varchar("subject", { length: 100 }),
  teacherId: uuid("teacher_id").references(() => users.id),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_classrooms_school").on(table.schoolId),
]);

export const classroomEnrollments = pgTable("classroom_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  removedAt: timestamp("removed_at"),
}, (table) => [
  uniqueIndex("idx_classroom_enrollment_unique").on(table.classroomId, table.learnerId),
]);

export const staffAssignments = pgTable("staff_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  schoolId: uuid("school_id").references(() => schools.id).notNull(),
  roleAtSchool: varchar("role_at_school", { length: 50 }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  removedAt: timestamp("removed_at"),
}, (table) => [
  uniqueIndex("idx_staff_assignment_unique").on(table.userId, table.schoolId),
]);

export const districtSettings = pgTable("district_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull().unique(),
  notificationPrefs: jsonb("notification_prefs").default({}),
  ssoConfig: jsonb("sso_config").default({}),
  branding: jsonb("branding").default({}),
  featureOverrides: jsonb("feature_overrides").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const districtActivityLog = pgTable("district_activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  actorId: uuid("actor_id").references(() => users.id).notNull(),
  actorName: varchar("actor_name", { length: 255 }),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_district_activity_tenant").on(table.tenantId, table.createdAt),
]);

export const iepRecords = pgTable("iep_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  startDate: date("start_date").notNull(),
  reviewDate: date("review_date").notNull(),
  expiryDate: date("expiry_date"),
  caseManagerId: uuid("case_manager_id").references(() => users.id),
  disabilityCategory: varchar("disability_category", { length: 100 }),
  placement: varchar("placement", { length: 100 }),
  accommodations: jsonb("accommodations").default([]),
  goals: jsonb("goals").default([]),
  services: jsonb("services").default([]),
  documentsUrl: jsonb("documents_url").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_iep_learner").on(table.learnerId),
  index("idx_iep_review").on(table.reviewDate),
]);

export const interventions = pgTable("interventions", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: uuid("learner_id").references(() => learners.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  tier: integer("tier").notNull().default(2),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: varchar("status", { length: 50 }).default("active"),
  assignedBy: uuid("assigned_by").references(() => users.id),
  progressNotes: jsonb("progress_notes").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_interventions_learner").on(table.learnerId),
]);
