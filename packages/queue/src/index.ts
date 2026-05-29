import { Queue, Worker, type Job } from "bullmq";
import { Redis } from 'ioredis'
import 'dotenv/config'

if(!process.env["REDIS_URL"]) { 
  throw new Error("REDIS_URL NOT CONFIGURE")
}

export const PDF_QUEUE_NAME = "pdf-processing";

export interface PdfJobData {
  documentId: string;
  userId: string;
  storagePath: string;
  mimeType: string;
  fileName: string;
}

export type PdfJobName = "process-pdf";

const SHARED_REDIS_OPTIONS = {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  keepAlive: 5000,
  noDelay: true,
  connectTimeout: 10000,
  // Never give up — exponential backoff capped at 30s
  retryStrategy: (times: number) => Math.min(times * 500, 30_000),
  reconnectOnError: (err: Error) =>
    /ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED/.test(err.message),
};

export function createRedisConnection() {
  return new Redis(
    process.env["REDIS_URL"] ?? "redis://localhost:6379",
    SHARED_REDIS_OPTIONS,
  );
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
  return new Redis(
    process.env["REDIS_URL"] ?? "redis://localhost:6379",
    SHARED_REDIS_OPTIONS,
  );
}

export function createPdfWorker(
  processor: (job: Job<PdfJobData, void, PdfJobName>) => Promise<void>
) {
  const connection = createRedisConnection();
  return new Worker<PdfJobData, void, PdfJobName>(PDF_QUEUE_NAME, processor, {
    connection,
    concurrency: 5,
    lockDuration: 5 * 60 * 1000,  // 5 min — prevents stall detection on large PDFs
    stalledInterval: 30 * 1000,   // check for stalled jobs every 30s
  });
}
