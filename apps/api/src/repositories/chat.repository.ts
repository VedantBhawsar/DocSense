import { db, chats, messages, type NewChat, type NewMessage } from "@docsense/db";
import { eq, sql } from "drizzle-orm";

export async function createChat(data: NewChat) {
  const [chat] = await db.insert(chats).values(data).returning();
  return chat!;
}

export async function getChatByDocumentAndUser(documentId: string, userId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.documentId, documentId))
    .limit(1);
  return chat ?? null;
}

export async function getChatById(chatId: string) {
  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
  return chat ?? null;
}

export async function getMessagesByChatId(chatId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);
}

export async function addMessage(data: NewMessage) {
  const [msg] = await db.insert(messages).values(data).returning();
  return msg!;
}

export async function findSimilarChunks(documentId: string, embedding: number[], topK = 5) {
  const vectorLiteral = `[${embedding.join(",")}]`;

  const rows = await db.execute<{ id: string; content: string; metadata: Record<string, unknown> | null; similarity: number }>(
    sql`
      WITH ranked AS (
        SELECT id, content, metadata,
               1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
        FROM chunks
        WHERE document_id = ${documentId}::uuid
      )
      SELECT * FROM ranked ORDER BY similarity DESC LIMIT ${topK}
    `
  );
  return rows.rows;
}
