import { pgTable, uuid, varchar, timestamp, jsonb, text } from "drizzle-orm/pg-core";
import { tenantTypeEnum } from "./enums.js";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: tenantTypeEnum("type").notNull().default("B2C_FAMILY"),
  settings: jsonb("settings").default({}),
  status: varchar("status", { length: 20 }).default("active"),
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
