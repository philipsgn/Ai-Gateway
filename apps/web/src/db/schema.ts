import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, numeric } from "drizzle-orm/pg-core";

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  monthlyBudgetUsd: numeric("monthly_budget_usd", { precision: 10, scale: 2 }).notNull().default("500.00"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleSub: varchar("google_sub", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 50 }).notNull().default("EMPLOYEE"),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: varchar("actor_id", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  targetId: varchar("target_id", { length: 255 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  checksum: varchar("checksum", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const grants = pgTable("grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  resourceName: varchar("resource_name", { length: 255 }).notNull(),
  grantedBy: varchar("granted_by", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"),
  accessCount: integer("access_count").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const vaultCredentials = pgTable("vault_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  resourceName: varchar("resource_name", { length: 255 }).notNull(),
  accountEmail: varchar("account_email", { length: 255 }).notNull(),
  encryptedSecret: text("encrypted_secret").notNull(),
  iv: varchar("iv", { length: 64 }).notNull(),
  authTag: varchar("auth_tag", { length: 64 }).notNull(),
  maxConcurrency: integer("max_concurrency").notNull().default(1),
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"),
  lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;
export type VaultCredential = typeof vaultCredentials.$inferSelect;
export type NewVaultCredential = typeof vaultCredentials.$inferInsert;


