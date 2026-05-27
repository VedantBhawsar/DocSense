import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({
  apiKey: process.env["OPENAI_API_KEY_CHAT"],
  configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
  model: "mistralai/mistral-small-3.1-24b",
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

export async function* streamAnswer(
  systemPrompt: string,
  history: LLMMessage[],
  userInput: string
): AsyncGenerator<string> {
  const langchainHistory = history.slice(0, -1).map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );

  const chain = prompt.pipe(llm);
  const stream = await chain.stream({
    systemPrompt,
    history: langchainHistory,
    input: userInput,
  });

  for await (const chunk of stream) {
    const text = typeof chunk.content === "string" ? chunk.content : "";
    if (text) yield text;
  }
}