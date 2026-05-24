import {
  createChat,
  getChatByDocumentAndUser,
  getChatById,
  getMessagesByChatId,
  addMessage,
  findSimilarChunks,
  updateChatShareToken,
  getChatByShareToken,
  countChatsByUser,
  countMessagesByChatId,
} from "../repositories/chat.repository.js";
import { randomUUID } from "crypto";
import { embedQuery } from "./embedding.service.js";
import { streamAnswer, type LLMMessage } from "../lib/llm.js";
import { checkMessageLimit, currentMonth } from "./subscription.service.js";
import { incrementUsage } from "../repositories/subscription.repository.js";

const MAX_CHATS_PER_USER = 3;
const MAX_MESSAGES_PER_CHAT = 3;

export async function getOrCreateChat(userId: string, documentId: string) {
  const existing = await getChatByDocumentAndUser(documentId, userId);
  if (existing) return existing;

  const chatCount = await countChatsByUser(userId);
  if (chatCount >= MAX_CHATS_PER_USER) {
    const err = Object.assign(new Error(`You can only create up to ${MAX_CHATS_PER_USER} chats. Please delete an existing chat to create a new one.`), {
      status: 403,
      code: "CHAT_LIMIT",
    });
    throw err;
  }

  return createChat({ userId, documentId, title: null });
}

export async function loadChatMessages(chatId: string, userId: string) {
  const chat = await getChatById(chatId);
  if (!chat) throw Object.assign(new Error("Chat not found"), { status: 404 });
  if (chat.userId !== userId) throw Object.assign(new Error("Forbidden"), { status: 403 });
  return getMessagesByChatId(chatId);
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
  const similarChunks = await findSimilarChunks(chat.documentId, queryEmbedding, 5);
  console.log(`[chat] findSimilarChunks: ${Date.now() - t2}ms (${similarChunks.length} chunks)`);

  const context = similarChunks.map((c, i) => {
    const loc = c.metadata?.loc as { pageNumber?: number } | undefined;
    const pageLabel = loc?.pageNumber != null ? ` (Page ${loc.pageNumber})` : "";
    return `[Excerpt ${i + 1}${pageLabel}]\n${c.content}`;
  }).join("\n\n");

const systemPrompt = `
You are a professional document assistant.

Your task is to answer user questions ONLY using the provided context.

=====================
DOCUMENT CONTEXT
=====================
${context}

=====================
RESPONSE INSTRUCTIONS
=====================

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
