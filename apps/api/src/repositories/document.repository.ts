import { db, documents, chats, messages, type NewDocument } from "@docsense/db";
import { eq, count } from "drizzle-orm";

export async function createDocument(data: NewDocument) {
  const [doc] = await db.insert(documents).values(data).returning();
  return doc;
}

export async function getDocumentsByUser(userId: string) {
  const rows = await db
    .select({
      id: documents.id,
      userId: documents.userId,
      name: documents.name,
      mimeType: documents.mimeType,
      storagePath: documents.storagePath,
      status: documents.status,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      messageCount: count(messages.id),
    })
    .from(documents)
    .leftJoin(chats, eq(chats.documentId, documents.id))
    .leftJoin(messages, eq(messages.chatId, chats.id))
    .where(eq(documents.userId, userId))
    .groupBy(documents.id);
  return rows;
}

export async function countDocumentsByUser(userId: string) {
  const rows = await db
    .select({ count: count(documents.id) })
    .from(documents)
    .where(eq(documents.userId, userId));
  return rows[0]?.count ?? 0;
}

export async function getDocumentById(id: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  return doc ?? null;
}

export async function deleteDocument(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
}

export async function renameDocument(id: string, name: string) {
  const [doc] = await db
    .update(documents)
    .set({ name })
    .where(eq(documents.id, id))
    .returning();
  return doc ?? null;
}

export async function updateDocumentStatus(id: string, status: "pending" | "processing" | "ready" | "failed") {
  const [doc] = await db
    .update(documents)
    .set({ status })
    .where(eq(documents.id, id))
    .returning();
  return doc ?? null;
}
