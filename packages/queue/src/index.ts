import { Queue, Worker, type Job } from "bullmq";
import { Redis } from 'ioredis'

export const PDF_QUEUE_NAME = "pdf-processing";

export interface PdfJobData {
  documentId: string;
  userId: string;
  storagePath: string;
  mimeType: string;
  fileName: string;
}

export type PdfJobName = "process-pdf";

export function createRedisConnection() {
  const redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });

  return redis
}

export function createPdfQueue() {
  const connection = createRedisConnection();
  return new Queue<PdfJobData, void, PdfJobName>(PDF_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  });
}

export type ProgressEvent =
  | { event: "processing" }
  | { event: "chunk"; index: number; total: number }
  | { event: "ready" }
  | { event: "failed"; error: string };

export function progressChannel(documentId: string) {
  return `doc-progress:${documentId}`;
}

export async function publishProgress(
  redis: Redis,
  documentId: string,
  payload: ProgressEvent
) {
  await redis.publish(progressChannel(documentId), JSON.stringify(payload));
}

export function createProgressSubscriber() {
  return new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
}

export function createPdfWorker(
  processor: (job: Job<PdfJobData, void, PdfJobName>) => Promise<void>
) {
  const connection = createRedisConnection();
  return new Worker<PdfJobData, void, PdfJobName>(PDF_QUEUE_NAME, processor, {
    connection,
    concurrency: 5,
  });
}
