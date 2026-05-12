import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projects } from "./projects";

export const projectSecrets = pgTable("project_secrets", {
  id:        serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  key:       text("key").notNull(),
  value:     text("value").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertProjectSecretSchema = createInsertSchema(projectSecrets).omit({ id: true, createdAt: true, updatedAt: true });
export type ProjectSecret       = typeof projectSecrets.$inferSelect;
export type InsertProjectSecret = z.infer<typeof insertProjectSecretSchema>;
