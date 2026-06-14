import {
  createChat,
  getChatByDocumentAndUser,
  getChatsByDocumentAndUser,
  getChatById,
  getMessagesByChatId,
  addMessage,
  findSimilarChunks,
  updateChatShareToken,
  getChatByShareToken,
  countChatsByUser,
  countMessagesByChatId,
  getRecentChatsWithMessages,
  getChatSummariesForDocument,
} from "../repositories/chat.repository.js";
import { randomUUID } from "crypto";
import { embedQuery } from "./embedding.service.js";
import { streamAnswer, type LLMMessage } from "../lib/llm.js";
import { checkMessageLimit, currentMonth } from "./subscription.service.js";
import { incrementUsage } from "../repositories/subscription.repository.js";
import { getOrCreateChatSummary } from "./summary.service.js";

const MAX_CHATS_PER_USER = 20;
const MAX_MESSAGES_PER_CHAT = 10;
const RECENT_CHATS_LIMIT = 3;
const SUMMARIES_LIMIT = 10;

async function buildMemoryContext(documentId: string, userId: string, currentChatId: string) {
  const recentChats = await getRecentChatsWithMessages(documentId, userId, currentChatId, RECENT_CHATS_LIMIT);
  const summaries = await getChatSummariesForDocument(documentId, userId, currentChatId, SUMMARIES_LIMIT);

  let memoryContext = "";

  if (recentChats.length > 0) {
    memoryContext += "====================\nRECENT CHATS (Full Context)\n====================\n\n";
    for (const chat of recentChats) {
      const msgs = await getMessagesByChatId(chat.id);
      const chatTitle = chat.title || `Chat ${chat.id.slice(0, 8)}`;
      memoryContext += `--- ${chatTitle} ---\n`;
      for (const m of msgs) {
        const role = m.role === "user" ? "User" : "Assistant";
        memoryContext += `${role}: ${m.content}\n`;
      }
      memoryContext += "\n";
    }
  }

  if (summaries.length > 0) {
    memoryContext += "====================\nPREVIOUS CHAT SUMMARIES\n====================\n\n";
    for (const s of summaries) {
      const chatTitle = s.chatTitle || `Chat ${s.chatId.slice(0, 8)}`;
      memoryContext += `• ${chatTitle}: ${s.summary}\n`;
    }
    memoryContext += "\n";
  }

  return memoryContext;
}

export async function createChatForDocument(userId: string, documentId: string) {
  const chatCount = await countChatsByUser(userId);
  if (chatCount >= MAX_CHATS_PER_USER) {
    const err = Object.assign(new Error(`You can only create up to ${MAX_CHATS_PER_USER} chats. Please delete an existing chat to create a new one.`), {
      status: 403,
      code: "CHAT_LIMIT",
    });
    throw err;
  }

  const existingChats = await getChatsByDocumentAndUser(documentId, userId);
  const title = `Chat ${existingChats.length + 1}`;

  return createChat({ userId, documentId, title });
}

export async function getChatsForDocument(documentId: string, userId: string) {
  return getChatsByDocumentAndUser(documentId, userId);
}

export async function loadChatMessages(chatId: string, userId: string) {
  const chat = await getChatById(chatId);
  if (!chat) throw Object.assign(new Error("Chat not found"), { status: 404 });
  if (chat.userId !== userId) throw Object.assign(new Error("Forbidden"), { status: 403 });
  const messages = await getMessagesByChatId(chatId);
  return { chat, messages };
}

export type StreamEvent =
  | { type: "token"; value: string }
  | { type: "suggestions"; value: string[] };

export async function* sendMessageStream(
  chatId: string,
  userId: string,
  userText: string
): AsyncGenerator<StreamEvent> {
  const t0 = Date.now();

  await checkMessageLimit(userId);

  const messageCount = await countMessagesByChatId(chatId);
  if (messageCount >= MAX_MESSAGES_PER_CHAT) {
    const err = Object.assign(new Error(`You can only send ${MAX_MESSAGES_PER_CHAT} messages per document. Upgrade to Pro for unlimited messages.`), {
      status: 403,
      code: "MESSAGE_LIMIT",
    });
    throw err;
  }

  const [chat, queryEmbedding] = await Promise.all([
    getChatById(chatId),
    embedQuery(userText),
  ]);
  console.log(`[chat] getChatById + embedQuery: ${Date.now() - t0}ms`);

  if (!chat) throw Object.assign(new Error("Chat not found"), { status: 404 });
  if (chat.userId !== userId) throw Object.assign(new Error("Forbidden"), { status: 403 });

  const t1 = Date.now();
  const [, history] = await Promise.all([
    addMessage({ chatId, role: "user", content: userText }),
    getMessagesByChatId(chatId),
  ]);
  console.log(`[chat] addMessage + getHistory: ${Date.now() - t1}ms`);

  const t2 = Date.now();
  const [similarChunks, memoryContext] = await Promise.all([
    findSimilarChunks(chat.documentId, queryEmbedding, 10),
    buildMemoryContext(chat.documentId, userId, chatId),
  ]);
  console.log(`[chat] findSimilarChunks + buildMemoryContext: ${Date.now() - t2}ms`);

  const context = similarChunks.map((c, i) => {
    const loc = c.metadata?.loc as { pageNumber?: number } | undefined;
    const pageLabel = loc?.pageNumber != null ? ` (Page ${loc.pageNumber})` : "";
    return `[Excerpt ${i + 1}${pageLabel}]\n${c.content}`;
  }).join("\n\n");

const systemPrompt = `
You are a professional document assistant.

Your task is to answer user questions ONLY using the provided context.
${memoryContext ? `
====================
CONVERSATION MEMORY
====================
${memoryContext}
` : ""}
====================
DOCUMENT CONTEXT
====================
${context}

====================
RESPONSE INSTRUCTIONS
====================

FORMAT:
- Use clean Markdown formatting.
- Structure responses with:
  - ## Headings
  - ### Subheadings
  - Bullet points
  - Numbered lists
  - Tables when useful
  - Code blocks for code/examples

STYLE:
- Keep responses concise and structured.
- Avoid large paragraphs.
- Use short sections.
- Bold important insights.
- Make answers easy to scan.

ANSWER FLOW:
1. ## Summary
2. ## Detailed Explanation
3. ## Important Points
4. ## Example / Reference
5. ## Conclusion

RULES:
- ONLY answer from the provided context.
- Do NOT invent information.
- If information is missing, say:
  "This information is not available in the provided document."
- If multiple answers exist, organize them clearly.
- For comparisons, use tables.
- For processes, use numbered steps.
- For technical topics, include code examples if present in context.

OUTPUT QUALITY:
The response should look like high-quality documentation, not casual chat.
`;

  const llmHistory: LLMMessage[] = history.slice(-10).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const t3 = Date.now();
  let firstToken = true;
  let fullResponse = "";
  for await (const token of streamAnswer(systemPrompt, llmHistory, userText)) {
    if (firstToken) {
      console.log(`[chat] time to first token: ${Date.now() - t3}ms`);
      firstToken = false;
    }
    fullResponse += token;
    yield { type: "token", value: token };
  }
  console.log(`[chat] LLM stream complete: ${Date.now() - t3}ms (${fullResponse.length} chars)`);
  console.log(`[chat] total: ${Date.now() - t0}ms`);

  await addMessage({ chatId, role: "assistant", content: fullResponse });
  await incrementUsage(userId, currentMonth(), "messageCount");

  getOrCreateChatSummary(chatId).catch((err) => console.error("[chat] Failed to generate summary:", err));
}

export async function toggleShareLink(chatId: string, userId: string) {
  const chat = await getChatById(chatId);
  if (!chat) throw Object.assign(new Error("Chat not found"), { status: 404 });
  if (chat.userId !== userId) throw Object.assign(new Error("Forbidden"), { status: 403 });

  const newToken = chat.shareToken ? null : randomUUID();
  const updated = await updateChatShareToken(chatId, newToken);
  return { shareToken: updated?.shareToken ?? null };
}

export async function getSharedChatMessages(shareToken: string) {
  const chat = await getChatByShareToken(shareToken);
  if (!chat) throw Object.assign(new Error("Shared chat not found"), { status: 404 });
  const msgs = await getMessagesByChatId(chat.id);
  return { chat, messages: msgs };
}

export async function exportChatMarkdown(chatId: string, userId: string) {
  const chat = await getChatById(chatId);
  if (!chat) throw Object.assign(new Error("Chat not found"), { status: 404 });
  if (chat.userId !== userId) throw Object.assign(new Error("Forbidden"), { status: 403 });

  const msgs = await getMessagesByChatId(chatId);
  const date = new Date().toISOString().slice(0, 10);

  const lines: string[] = [`# Chat Export — ${date}`, ""];
  for (const m of msgs) {
    const label = m.role === "user" ? "**You**" : "**Assistant**";
    const time = new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    lines.push(`${label} · ${time}`, "", m.content, "");
  }

  return {
    markdown: lines.join("\n"),
    filename: `chat-${chatId.slice(0, 8)}-${date}.md`,
  };
}
