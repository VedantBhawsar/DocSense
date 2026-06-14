import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getMessagesByChatId, upsertChatSummary, getChatSummary } from "../repositories/chat.repository.js";
import type { Message } from "@docsense/db";

const llm = new ChatOpenAI({
  apiKey: process.env["OPENAI_API_KEY_CHAT"],
  configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
  model: process.env["CHAT_MODEL"] || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
  streaming: false,
  temperature: 0.3,
});

const SUMMARY_PROMPT = `You are a document chat summarizer. Given a conversation between a user and an AI assistant about a document, create a concise summary that captures:
1. The main topics discussed
2. Key questions asked and answered
3. Important insights or conclusions

Keep the summary brief (2-4 sentences) but informative. Focus on what would help recall the conversation context later.

Conversation:
{conversation}

Summary:`;

export async function generateChatSummary(chatId: string): Promise<string> {
  const messages = await getMessagesByChatId(chatId);
  
  if (messages.length < 2) {
    return "";
  }

  const conversation = messages.map((m: Message) => {
    const role = m.role === "user" ? "User" : "Assistant";
    return `${role}: ${m.content}`;
  }).join("\n");

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SUMMARY_PROMPT],
  ]);

  const chain = prompt.pipe(llm);
  const result = await chain.invoke({ conversation });
  
  const summary = typeof result.content === "string" ? result.content.trim() : "";
  
  await upsertChatSummary({
    chatId,
    summary,
    messageCount: messages.length,
  });

  return summary;
}

export async function getOrCreateChatSummary(chatId: string): Promise<string> {
  const existing = await getChatSummary(chatId);
  if (existing) {
    return existing.summary;
  }
  return generateChatSummary(chatId);
}