import { pgTable, uuid, varchar, timestamp, jsonb, integer, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";

export const connectorTypeEnum = pgEnum("connector_type", [
  "lms",
  "sis",
  "sso",
  "assessment",
]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "pending",
  "authorized",
  "active",
  "syncing",
  "error",
  "disconnected",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "pending",
  "running",
  "completed",
  "partial",
  "failed",
]);

export const integrationConnections = pgTable("integration_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  connectorId: varchar("connector_id", { length: 64 }).notNull(),
  connectorName: varchar("connector_name", { length: 128 }).notNull(),
  connectorType: connectorTypeEnum("connector_type").notNull(),
  status: connectionStatusEnum("status").notNull().default("pending"),
  credentials: jsonb("credentials").default({}),
  config: jsonb("config").default({}),
  metadata: jsonb("metadata").default({}),
  externalOrgId: varchar("external_org_id", { length: 255 }),
  lastSyncAt: timestamp("last_sync_at"),
  connectedBy: uuid("connected_by"),
  connectedAt: timestamp("connected_at"),
  disconnectedAt: timestamp("disconnected_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ic_tenant").on(table.tenantId),
  index("idx_ic_connector").on(table.connectorId),
  index("idx_ic_status").on(table.status),
]);

export const integrationSyncLogs = pgTable("integration_sync_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id").notNull().references(() => integrationConnections.id),
  syncType: varchar("sync_type", { length: 64 }).notNull(),
  status: syncStatusEnum("status").notNull().default("pending"),
  recordsSynced: integer("records_synced").default(0),
  recordsFailed: integer("records_failed").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  details: jsonb("details").default({}),
  errors: jsonb("errors").default([]),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  triggeredBy: uuid("triggered_by"),
}, (table) => [
  index("idx_isl_connection").on(table.connectionId),
  index("idx_isl_started").on(table.startedAt),
]);

export const integrationRosterMappings = pgTable("integration_roster_mappings", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id").notNull().references(() => integrationConnections.id),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  externalType: varchar("external_type", { length: 64 }).notNull(),
  aivoId: uuid("aivo_id"),
  aivoType: varchar("aivo_type", { length: 64 }).notNull(),
  externalData: jsonb("external_data").default({}),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_irm_unique_mapping").on(table.connectionId, table.externalId, table.externalType),
  index("idx_irm_connection").on(table.connectionId),
]);
