import { pgTable, serial, text, timestamp, jsonb, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull().default("native"),
  version: text("version").notNull().default("1.0.0"),
  author: text("author").notNull().default("ruflo"),
  icon: text("icon").notNull().default("🔌"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  isInstalled: boolean("is_installed").notNull().default(false),
  isEnabled: boolean("is_enabled").notNull().default(false),
  rating: real("rating").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  npmPackage: text("npm_package"),
  homepageUrl: text("homepage_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mcpServers = pgTable("mcp_servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  endpoint: text("endpoint").notNull(),
  protocol: text("protocol").notNull().default("http"),
  status: text("status").notNull().default("disconnected"),
  authToken: text("auth_token"),
  tools: jsonb("tools").$type<Array<{ name: string; description: string; schema: Record<string, unknown> }>>().notNull().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  isEnabled: boolean("is_enabled").notNull().default(true),
  lastPingAt: timestamp("last_ping_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPluginSchema = createInsertSchema(plugins).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({ id: true, createdAt: true, updatedAt: true });

export type Plugin = typeof plugins.$inferSelect;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;
