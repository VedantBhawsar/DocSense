import { pgTable, uuid, text, integer, timestamp, index, customType } from "drizzle-orm/pg-core";
import { documents } from "./documents.js";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    const dim = (config as { dimensions?: number } | undefined)?.dimensions ?? 1536;
    return `vector(${dim})`;
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string) {
    return value.slice(1, -1).split(",").map(Number);
  },
});

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 4096 }).notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("chunks_document_id_idx").on(table.documentId),
  ]
);

export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
