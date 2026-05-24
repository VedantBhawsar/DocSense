import { db } from "@docsense/db";
import { sql } from "drizzle-orm";

export async function searchAllChunks(userId: string, embedding: number[], topK = 8) {
  const vectorLiteral = `[${embedding.join(",")}]`;

  const rows = await db.execute<{
    chunkId: string;
    documentId: string;
    documentName: string;
    content: string;
    similarity: number;
    metadata: Record<string, unknown> | null;
  }>(
    sql`
      WITH ranked AS (
        SELECT
          c.id AS "chunkId",
          c.document_id AS "documentId",
          d.name AS "documentName",
          c.content,
          c.metadata,
          1 - (c.embedding <=> ${vectorLiteral}::vector) AS similarity
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE d.user_id = ${userId}::uuid
      )
      SELECT * FROM ranked ORDER BY similarity DESC LIMIT ${topK}
    `
  );

  return rows.rows;
}
