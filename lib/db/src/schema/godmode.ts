import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const godmodeRaces = pgTable("godmode_races", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  winnerId: text("winner_id").notNull(),
  winnerName: text("winner_name").notNull(),
  winnerScore: integer("winner_score").notNull().default(0),
  scores: jsonb("scores").notNull().default({}),
  elapsed: jsonb("elapsed").notNull().default({}),
  previews: jsonb("previews").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertGodmodeRaceSchema = createInsertSchema(godmodeRaces).omit({
  id: true,
  createdAt: true,
});

export type GodmodeRace = typeof godmodeRaces.$inferSelect;
export type InsertGodmodeRace = z.infer<typeof insertGodmodeRaceSchema>;
