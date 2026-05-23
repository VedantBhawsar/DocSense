import {
  createChat,
  getChatByDocumentAndUser,
  getChatById,
  getMessagesByChatId,
  addMessage,
  findSimilarChunks,
} from "../repositories/chat.repository.js";
import { embedQuery } from "./embedding.service.js";
import { generateAnswer, type LLMMessage } from "../lib/llm.js";

export async function getOrCreateChat(userId: string, documentId: string) {
  const existing = await getChatByDocumentAndUser(documentId, userId);
  if (existing) return existing;

  return createChat({ userId, documentId, title: null });
}

export async function loadChatMessages(chatId: string, userId: string) {
  const chat = await getChatById(chatId);
  if (!chat) throw Object.assign(new Error("Chat not found"), { status: 404 });
  if (chat.userId !== userId) throw Object.assign(new Error("Forbidden"), { status: 403 });

  return getMessagesByChatId(chatId);
}

export async function sendMessage(chatId: string, userId: string, userText: string) {
  const chat = await getChatById(chatId);
  if (!chat) throw Object.assign(new Error("Chat not found"), { status: 404 });
  if (chat.userId !== userId) throw Object.assign(new Error("Forbidden"), { status: 403 });

  const userMsg = await addMessage({ chatId, role: "user", content: userText });

  const queryEmbedding = await embedQuery(userText);
  const similarChunks = await findSimilarChunks(chat.documentId, queryEmbedding, 5);

  const context = similarChunks
    .map((c, i) => `[${i + 1}] ${c.content}`)
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant answering questions about a document.
Use ONLY the context excerpts below to answer. If the answer is not in the context, say so.

CONTEXT:
${context}`;

  const history = await getMessagesByChatId(chatId);
  const llmHistory: LLMMessage[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const answer = await generateAnswer(systemPrompt, llmHistory);

  const assistantMsg = await addMessage({ chatId, role: "assistant", content: answer });

  return { userMessage: userMsg, assistantMessage: assistantMsg };
}
