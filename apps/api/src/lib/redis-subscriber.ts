import { Redis } from 'ioredis';

let subscriber: Redis | null = null;

export function getProgressSubscriber(): Redis {
  if (!subscriber) {
    subscriber = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      connectTimeout: 10000,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      keepAlive: true,
      enableOfflineQueue: false,
    });

    subscriber.on("error", (err) => {
      console.error("Progress subscriber error:", err);
    });
  }
  return subscriber;
}

export async function closeProgressSubscriber(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
}