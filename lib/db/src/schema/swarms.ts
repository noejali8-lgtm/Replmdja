import { pgTable, serial, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const swarms = pgTable("swarms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  topology: text("topology").notNull().default("hierarchical"),
  status: text("status").notNull().default("idle"),
  description: text("description").notNull().default(""),
  config: jsonb("config").$type<{
    maxAgents: number;
    consensusThreshold: number;
    learningRate: number;
    adaptiveRouting: boolean;
  }>().notNull().default({ maxAgents: 10, consensusThreshold: 0.7, learningRate: 0.01, adaptiveRouting: true }),
  metrics: jsonb("metrics").$type<{
    totalTasks: number;
    successRate: number;
    activeAgents: number;
    throughput: number;
  }>().notNull().default({ totalTasks: 0, successRate: 0, activeAgents: 0, throughput: 0 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const swarmMessages = pgTable("swarm_messages", {
  id: serial("id").primaryKey(),
  swarmId: integer("swarm_id").notNull().references(() => swarms.id, { onDelete: "cascade" }),
  fromAgentId: integer("from_agent_id"),
  toAgentId: integer("to_agent_id"),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertSwarmSchema = createInsertSchema(swarms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSwarmMessageSchema = createInsertSchema(swarmMessages).omit({ id: true, createdAt: true });

export type Swarm = typeof swarms.$inferSelect;
export type InsertSwarm = z.infer<typeof insertSwarmSchema>;
export type SwarmMessage = typeof swarmMessages.$inferSelect;
