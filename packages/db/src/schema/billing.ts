import { pgTable, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { subscriptionStatusEnum } from "./enums";
import { users } from "./users";
import { tenants } from "./tenants";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  plan: varchar("plan", { length: 100 }).notNull(),
  status: subscriptionStatusEnum("status").default("ACTIVE"),
  currentPeriodEnd: timestamp("current_period_end"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tutorSubscriptions = pgTable("tutor_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  tutorSku: varchar("tutor_sku", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  stripeItemId: varchar("stripe_item_id", { length: 255 }),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
  deactivatedAt: timestamp("deactivated_at"),
  graceEndsAt: timestamp("grace_ends_at"),
});
