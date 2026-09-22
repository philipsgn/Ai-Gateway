import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleSub: varchar("google_sub", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 50 }).notNull().default("EMPLOYEE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: varchar("actor_id", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  targetId: varchar("target_id", { length: 255 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const grants = pgTable("grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  resourceName: varchar("resource_name", { length: 255 }).notNull(),
  grantedBy: uuid("granted_by").references(() => employees.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;
