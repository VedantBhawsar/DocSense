import { Redis } from 'ioredis';

let subscriber: Redis | null = null;

// Channels we're currently subscribed to — re-applied after reconnect
const activeChannels = new Set<string>();

export function getProgressSubscriber(): Redis {
  if (!subscriber) {
    subscriber = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      keepAlive: 5000,
      noDelay: true,
      connectTimeout: 10000,
      // Infinite retry with exponential backoff capped at 30s
      retryStrategy: (times) => Math.min(times * 500, 30_000),
      reconnectOnError: (err) =>
        /ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED/.test(err.message),
    });

    subscriber.on("error", (err) => {
      console.error("[redis-subscriber] error:", err.message);
    });

    // Re-subscribe to all active channels after a reconnect
    subscriber.on("ready", () => {
      if (activeChannels.size > 0) {
        console.log(`[redis-subscriber] reconnected — re-subscribing to ${activeChannels.size} channel(s)`);
        subscriber!.subscribe(...activeChannels).catch((err) => {
          console.error("[redis-subscriber] re-subscribe failed:", err.message);
        });
      }
    });
  }
  return subscriber;
}

export function trackChannel(channel: string) {
  activeChannels.add(channel);
}

export function untrackChannel(channel: string) {
  activeChannels.delete(channel);
}

export async function closeProgressSubscriber(): Promise<void> {
  if (subscriber) {
    activeChannels.clear();
    await subscriber.quit();
    subscriber = null;
  }
}
