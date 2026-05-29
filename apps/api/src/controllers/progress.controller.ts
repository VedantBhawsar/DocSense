import type { Request, Response } from "express";
import {
  progressChannel,
  type ProgressEvent,
} from "@docsense/queue";
import { getProgressSubscriber, trackChannel, untrackChannel } from "../lib/redis-subscriber.js";

export async function documentProgressHandler(req: Request, res: Response) {
  const { id: documentId } = req.params as { id: string };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (payload: ProgressEvent) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const subscriber = getProgressSubscriber();
  const channel = progressChannel(documentId);

  trackChannel(channel);
  await subscriber.subscribe(channel);

  const messageHandler = (_ch: string, message: string) => {
    const payload = JSON.parse(message) as ProgressEvent;
    send(payload);
    if (payload.event === "ready" || payload.event === "failed") {
      cleanup();
    }
  };

  const cleanup = () => {
    subscriber.removeListener("message", messageHandler);
    untrackChannel(channel);
    subscriber.unsubscribe(channel).catch(() => {});
    res.end();
  };

  subscriber.on("message", messageHandler);

  req.on("close", cleanup);
}
