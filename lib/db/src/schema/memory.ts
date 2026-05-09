import { pgTable, serial, text, timestamp, jsonb, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const memoryEntries = pgTable("memory_entries", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  namespace: text("namespace").notNull().default("global"),
  agentId: integer("agent_id"),
  embedding: jsonb("embedding").$type<number[]>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  importance: real("importance").notNull().default(0.5),
  accessCount: integer("access_count").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reasoningBank = pgTable("reasoning_bank", {
  id: serial("id").primaryKey(),
  taskType: text("task_type").notNull(),
  pattern: text("pattern").notNull(),
  solution: text("solution").notNull(),
  confidence: real("confidence").notNull().default(0.5),
  usageCount: integer("usage_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  embedding: jsonb("embedding").$type<number[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const trajectories = pgTable("trajectories", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id"),
  taskDescription: text("task_description").notNull(),
  steps: jsonb("steps").$type<Array<{ action: string; result: string; timestamp: string }>>().notNull().default([]),
  outcome: text("outcome").notNull(),
  reward: real("reward").notNull().default(0),
  sonaScore: real("sona_score").notNull().default(0),
  learnedPatterns: jsonb("learned_patterns").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertMemoryEntrySchema = createInsertSchema(memoryEntries).omit({ id: true, createdAt: true, updatedAt: true, lastAccessedAt: true });
export const insertReasoningBankSchema = createInsertSchema(reasoningBank).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrajectorySchema = createInsertSchema(trajectories).omit({ id: true, createdAt: true });

export type MemoryEntry = typeof memoryEntries.$inferSelect;
export type InsertMemoryEntry = z.infer<typeof insertMemoryEntrySchema>;
export type ReasoningBankEntry = typeof reasoningBank.$inferSelect;
export type Trajectory = typeof trajectories.$inferSelect;
