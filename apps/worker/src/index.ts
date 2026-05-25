import "dotenv/config";
import {
  createPdfWorker,
  createRedisConnection,
  publishProgress,
  type PdfJobData,
} from "@docsense/queue";
import { db, documents, chunks } from "@docsense/db";
import { eq } from "drizzle-orm";
import type { Job } from "bullmq";
import OpenAI from "openai";
import { TokenTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import pLimit from "p-limit";
import fs from "fs";
import path from "path";
import os from "os";
import { downloadToFile, deleteFile } from "./lib/minio.js";

const redis = createRedisConnection();

function cleanText(text: string) {
  return text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/Page \d+/gi, "")
    .trim();
}

async function processPdf(job: Job<PdfJobData>): Promise<void> {
  const { documentId, storagePath, fileName, mimeType } = job.data;

  console.log(
    `[worker] processing job ${job.id} — document ${documentId} (${fileName})`,
  );

  await db.delete(chunks).where(eq(chunks.documentId, documentId));

  await db
    .update(documents)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(documents.id, documentId));
  await publishProgress(redis, documentId, { event: "processing" });

  let localPath = "";
  try {
    const tmpDir = os.tmpdir();
    localPath = path.join(tmpDir, `doc-${documentId}${path.extname(fileName)}`);
    await downloadToFile(storagePath, localPath);

    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const loader = isDocx
      ? new DocxLoader(localPath)
      : new PDFLoader(localPath);

    const docs = await loader.load();
    const openai = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env["OPENAI_API_KEY"],
    });

    const cleanedDocs = docs.map((doc) => ({
      ...doc,
      pageContent: cleanText(doc.pageContent),
    }));

    const splitter = new TokenTextSplitter({
      chunkSize: 800,
      chunkOverlap: 120,
      encodingName: "cl100k_base",
    });

    const splitDocs = await splitter.splitDocuments(cleanedDocs);

    const splitsDocs = splitDocs.filter((d) => {
      const text = d.pageContent.trim();
      return text.length >= 80 && text.split(/\s+/).length >= 15;
    });
    
    const total = splitsDocs.length;
    const limit = pLimit(3);
    let completed = 0;

    const createEmbeddingWithRetry = async (
      text: string,
      retries = 5,
    ): Promise<number[]> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await openai.embeddings.create({
            model: "nvidia/nv-embed-v1",
            input: text,
          });
          return res.data[0]!.embedding;
        } catch (err: any) {
          if (err?.status === 429 && attempt < retries - 1) {
            const delay = Math.min(1000 * 2 ** attempt, 30000);
            console.warn(
              `[worker] 429 rate limit — retrying in ${delay}ms (attempt ${attempt + 1})`,
            );
            await new Promise((r) => setTimeout(r, delay));
          } else {
            throw err;
          }
        }
      }
      throw new Error("embedding failed after max retries");
    };

    await Promise.all(
      splitsDocs.map((chunk, i) =>
        limit(async () => {
          const embedding = await createEmbeddingWithRetry(chunk.pageContent);

          await db.insert(chunks).values({
            documentId,
            content: chunk.pageContent,
            embedding,
            chunkIndex: i,
            metadata: chunk.metadata as Record<string, unknown>,
          });

          completed++;
          await publishProgress(redis, documentId, {
            event: "chunk",
            index: completed,
            total,
          });
        }),
      ),
    );

    await db
      .update(documents)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(documents.id, documentId));
    await publishProgress(redis, documentId, { event: "ready" });

    console.log(`[worker] completed job ${job.id} — document ${documentId}`);
  } catch (err) {
    await db
      .update(documents)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(documents.id, documentId));
    await publishProgress(redis, documentId, {
      event: "failed",
      error: err instanceof Error ? err.message : "unknown error",
    });
    throw err;
  } finally {
    if (localPath && fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  }
}

const worker = createPdfWorker(processPdf);

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] worker error:", err);
});

console.log("[worker] pdf-processing worker started");

async function shutdown() {
  await worker.close();
  await redis.quit();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
