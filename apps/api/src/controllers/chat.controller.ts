import type { Request, Response } from "express";
import { getOrCreateChat, loadChatMessages, sendMessage } from "../services/chat.service.js";

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

  const result = await sendMessage(req.params["chatId"]! as string, req.user!.id, content.trim());
  res.json(result);
}
