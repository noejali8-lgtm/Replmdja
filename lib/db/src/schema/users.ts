import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const users = pgTable("users", {
  id:           serial("id").primaryKey(),
  username:     text("username").notNull().unique(),
  email:        text("email").unique(),
  passwordHash: text("password_hash").notNull().default(""),
  displayName:  text("display_name"),
  avatarUrl:    text("avatar_url"),
  isAdmin:      boolean("is_admin").notNull().default(false),
  plan:         text("plan").notNull().default("free"),       // free | starter | pro | team
  githubId:     text("github_id").unique(),
  githubToken:  text("github_token"),
  googleId:     text("google_id").unique(),
  provider:     text("provider").notNull().default("local"),  // local | github | google
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export type User    = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
