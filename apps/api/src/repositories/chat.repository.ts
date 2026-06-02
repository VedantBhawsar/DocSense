import { db, chats, messages, type NewChat, type NewMessage } from "@docsense/db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export async function createChat(data: NewChat) {
  const [chat] = await db.insert(chats).values(data).returning();
  return chat!;
}

export async function getChatByDocumentAndUser(documentId: string, userId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.documentId, documentId), eq(chats.userId, userId)))
    .limit(1);
  return chat ?? null;
}

export async function getChatsByDocumentAndUser(documentId: string, userId: string) {
  return db
    .select()
    .from(chats)
    .where(and(eq(chats.documentId, documentId), eq(chats.userId, userId)))
    .orderBy(desc(chats.createdAt));
}

export async function getChatById(chatId: string) {
  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
  return chat ?? null;
}

export async function countChatsByUser(userId: string) {
  const rows = await db
    .select({ count: count(chats.id) })
    .from(chats)
    .where(eq(chats.userId, userId));
  return rows[0]?.count ?? 0;
}

export async function getMessagesByChatId(chatId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);
}

export async function countMessagesByChatId(chatId: string) {
  const rows = await db
    .select({ count: count(messages.id) })
    .from(messages)
    .where(eq(messages.chatId, chatId));
  return rows[0]?.count ?? 0;
}

export async function addMessage(data: NewMessage) {
  const [msg] = await db.insert(messages).values(data).returning();
  return msg!;
}

export async function updateChatShareToken(chatId: string, shareToken: string | null) {
  const [chat] = await db
    .update(chats)
    .set({ shareToken })
    .where(eq(chats.id, chatId))
    .returning();
  return chat ?? null;
}

export async function getChatByShareToken(shareToken: string) {
  const [chat] = await db.select().from(chats).where(eq(chats.shareToken, shareToken));
  return chat ?? null;
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
