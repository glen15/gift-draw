import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const drawRecords = pgTable("draw_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  winner: text("winner").notNull(),
  gift: text("gift"), // 선물 이름 (선택사항)
  totalParticipants: integer("total_participants").notNull(),
  participants: text("participants").array().notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertDrawRecordSchema = createInsertSchema(drawRecords).omit({
  id: true,
  timestamp: true,
});

export type InsertDrawRecord = z.infer<typeof insertDrawRecordSchema>;
export type DrawRecord = typeof drawRecords.$inferSelect;
