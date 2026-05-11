import { pgTable, serial, text, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { users } from "./users";

export const projects = pgTable("projects", {
  id:          serial("id").primaryKey(),
  userId:      integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  slug:        text("slug").notNull().unique(),
  description: text("description").default(""),
  language:    text("language").notNull().default("node"), // node | python | html | react
  template:    text("template").default("blank"),
  dirPath:     text("dir_path").notNull(),
  isPublic:    boolean("is_public").notNull().default(false),
  runCmd:      text("run_cmd"),
  entryFile:   text("entry_file").default("index.js"),
  metadata:    jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export type Project       = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
