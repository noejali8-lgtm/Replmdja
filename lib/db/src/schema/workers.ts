import { pgTable, serial, text, timestamp, jsonb, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  schedule: text("schedule").notNull().default("*/5 * * * *"),
  status: text("status").notNull().default("idle"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  runCount: integer("run_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  avgDurationMs: real("avg_duration_ms").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workerRuns = pgTable("worker_runs", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  output: jsonb("output").$type<Record<string, unknown>>(),
  error: text("error"),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkerRunSchema = createInsertSchema(workerRuns).omit({ id: true });

export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type WorkerRun = typeof workerRuns.$inferSelect;
