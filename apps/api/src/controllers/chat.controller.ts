import type { Request, Response } from "express";
import { createChatForDocument, getChatsForDocument, loadChatMessages, sendMessageStream, exportChatMarkdown, toggleShareLink, getSharedChatMessages } from "../services/chat.service.js";

export async function createChatHandler(req: Request, res: Response) {
  const { documentId } = req.body as { documentId?: string };
  if (!documentId) {
    res.status(400).json({ error: "documentId is required" });
    return;
  }

  try {
    const chat = await createChatForDocument(req.user!.id, documentId);
    res.json({ chat });
  } catch (err: any) {
    res.status(err?.status ?? 500).json({ error: err.message });
  }
}

export async function getChatsForDocumentHandler(req: Request, res: Response) {
  const { documentId } = req.query as { documentId?: string };
  if (!documentId) {
    res.status(400).json({ error: "documentId query param is required" });
    return;
  }

  try {
    const chats = await getChatsForDocument(documentId, req.user!.id);
    res.json({ chats });
  } catch (err: any) {
    res.status(err?.status ?? 500).json({ error: err.message });
  }
}

export async function getMessagesHandler(req: Request, res: Response) {
  const result = await loadChatMessages(req.params["chatId"]! as string, req.user!.id);
  res.json(result);
}

export async function exportChatHandler(req: Request, res: Response) {
  try {
    const { markdown, filename } = await exportChatMarkdown(req.params["chatId"]! as string, req.user!.id);
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(markdown);
  } catch (err: any) {
    res.status(err?.status ?? 500).json({ error: err.message });
  }
}

export async function toggleShareHandler(req: Request, res: Response) {
  try {
    const result = await toggleShareLink(req.params["chatId"]! as string, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(err?.status ?? 500).json({ error: err.message });
  }
}

export async function getSharedChatHandler(req: Request, res: Response) {
  try {
    const result = await getSharedChatMessages(req.params["shareToken"]! as string);
    res.json(result);
  } catch (err: any) {
    res.status(err?.status ?? 500).json({ error: err.message });
  }
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
      } else if (event.type === "usage") {
        res.write(`data: ${JSON.stringify({ usage: event })}\n\n`);
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
