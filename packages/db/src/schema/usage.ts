import { pgTable, uuid, text, integer, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const usage = pgTable(
  "usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    month: text("month").notNull(),
    documentCount: integer("document_count").notNull().default(0),
    messageCount: integer("message_count").notNull().default(0),
  },
  (t) => [unique().on(t.userId, t.month)]
);

export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
