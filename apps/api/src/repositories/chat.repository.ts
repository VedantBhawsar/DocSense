import { db, chats, messages, chatSummaries, type NewChat, type NewMessage, type NewChatSummary } from "@docsense/db";
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

export async function getChatSummary(chatId: string) {
  const [summary] = await db
    .select()
    .from(chatSummaries)
    .where(eq(chatSummaries.chatId, chatId));
  return summary ?? null;
}

export async function upsertChatSummary(data: NewChatSummary) {
  const existing = await getChatSummary(data.chatId);
  if (existing) {
    const [updated] = await db
      .update(chatSummaries)
      .set({ summary: data.summary, messageCount: data.messageCount, updatedAt: new Date() })
      .where(eq(chatSummaries.chatId, data.chatId))
      .returning();
    return updated!;
  }
  const [created] = await db.insert(chatSummaries).values(data).returning();
  return created!;
}

export async function getRecentChatsWithMessages(documentId: string, userId: string, excludeChatId: string, limit = 3) {
  return db
    .select()
    .from(chats)
    .where(and(
      eq(chats.documentId, documentId),
      eq(chats.userId, userId),
    ))
    .orderBy(desc(chats.updatedAt))
    .limit(limit);
}

export async function getChatSummariesForDocument(documentId: string, userId: string, excludeChatId: string, limit = 10) {
  return db
    .select({
      summary: chatSummaries.summary,
      messageCount: chatSummaries.messageCount,
      chatId: chatSummaries.chatId,
      chatTitle: chats.title,
      chatCreatedAt: chats.createdAt,
    })
    .from(chatSummaries)
    .innerJoin(chats, eq(chats.id, chatSummaries.chatId))
    .where(and(
      eq(chats.documentId, documentId),
      eq(chats.userId, userId),
    ))
    .orderBy(desc(chatSummaries.updatedAt))
    .limit(limit);
}
