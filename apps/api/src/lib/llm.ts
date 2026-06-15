import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({
  apiKey: process.env["OPENAI_API_KEY_CHAT"],
  configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
  model: process.env["CHAT_MODEL"] ||  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
  streaming: true,
  temperature: 0.5
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "{systemPrompt}"],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMTokenChunk {
  type: "token";
  value: string;
}

export interface LLMUsageChunk {
  type: "usage";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export type LLMStreamChunk = LLMTokenChunk | LLMUsageChunk;

export async function* streamAnswer(
  systemPrompt: string,
  history: LLMMessage[],
  userInput: string
): AsyncGenerator<LLMStreamChunk> {
  const langchainHistory = history.slice(0, -1).map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );

  const chain = prompt.pipe(llm);
  const stream = await chain.stream({
    systemPrompt,
    history: langchainHistory,
    input: userInput,
  });

  let lastChunk: any = undefined;
  for await (const chunk of stream) {
    lastChunk = chunk;
    const text = typeof chunk.content === "string" ? chunk.content : "";
    if (text) yield { type: "token", value: text };
  }

  const usageMeta = lastChunk?.usage_metadata;
  const rawUsage = lastChunk?.response_metadata?.tokenUsage;
  if (usageMeta || rawUsage) {
    const u = usageMeta ?? rawUsage;
    yield {
      type: "usage",
      promptTokens: u.input_tokens ?? u.promptTokens ?? 0,
      completionTokens: u.output_tokens ?? u.completionTokens ?? 0,
      totalTokens: u.total_tokens ?? 0,
      model: process.env["CHAT_MODEL"] || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    };
  }
}