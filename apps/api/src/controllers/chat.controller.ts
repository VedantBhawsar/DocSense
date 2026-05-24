import type { Request, Response } from "express";
import { getOrCreateChat, loadChatMessages, sendMessageStream } from "../services/chat.service.js";

export async function getOrCreateChatHandler(req: Request, res: Response) {
  const { documentId } = req.body as { documentId?: string };
  if (!documentId) {
    res.status(400).json({ error: "documentId is required" });
    return;
  }

  const chat = await getOrCreateChat(req.user!.id, documentId);
  res.json({ chat });
}

export async function getMessagesHandler(req: Request, res: Response) {
  const messages = await loadChatMessages(req.params["chatId"]! as string, req.user!.id);
  res.json({ messages });
}

export async function sendMessageHandler(req: Request, res: Response) {
  const { content } = req.body as { content?: string };
  if (!content?.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const stream = sendMessageStream(req.params["chatId"]! as string, req.user!.id, content.trim());
    for await (const event of stream) {
      if (event.type === "token") {
        res.write(`data: ${JSON.stringify({ token: event.value })}\n\n`);
      } else if (event.type === "suggestions") {
        res.write(`data: ${JSON.stringify({ suggestions: event.value })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
  } catch (err: any) {
    const status = err?.status ?? 500;
    res.write(`data: ${JSON.stringify({ error: err.message, status })}\n\n`);
  } finally {
    res.end();
  }
}
