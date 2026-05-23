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
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const redis = createRedisConnection();

async function processPdf(job: Job<PdfJobData>): Promise<void> {
  const { documentId, storagePath, fileName } = job.data;

  console.log(
    `[worker] processing job ${job.id} — document ${documentId} (${fileName})`,
  );

  await db
    .update(documents)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(documents.id, documentId));
  await publishProgress(redis, documentId, { event: "processing" });

  try {
    const loader = new PDFLoader(storagePath);

    const docs = await loader.load();
    const openai = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env["OPENAI_API_KEY"],
    });

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 150,
    });

    const splitsDocs = await splitter.splitDocuments(docs);
    const total = splitsDocs.length;

    for (let i = 0; i < total; i++) {
      const chunk = splitsDocs[i]!;
      const embeddingRes = await openai.embeddings.create({
        model: "nvidia/nv-embed-v1",
        input: chunk.pageContent,
      });

      await db.insert(chunks).values({
        documentId,
        content: chunk.pageContent,
        embedding: embeddingRes.data[0]!.embedding,
        chunkIndex: i,
      });

      await publishProgress(redis, documentId, { event: "chunk", index: i + 1, total });
    }

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
