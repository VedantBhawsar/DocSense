import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { chats } from "./chats.js";

export const chatSummaries = pgTable("chat_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  messageCount: integer("message_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ChatSummary = typeof chatSummaries.$inferSelect;
export type NewChatSummary = typeof chatSummaries.$inferInsert;