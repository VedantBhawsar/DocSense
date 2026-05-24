import { db, documents, type NewDocument } from "@docsense/db";
import { eq } from "drizzle-orm";

export async function createDocument(data: NewDocument) {
  const [doc] = await db.insert(documents).values(data).returning();
  return doc;
}

export async function getDocumentsByUser(userId: string) {
  return db.select().from(documents).where(eq(documents.userId, userId));
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
