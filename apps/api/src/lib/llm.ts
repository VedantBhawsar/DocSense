import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY_CHAT"],
  baseURL: "https://integrate.api.nvidia.com/v1"
});

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateAnswer(
  systemPrompt: string,
  history: LLMMessage[]
): Promise<string> {
  const response = await client.chat.completions.create({
    model: "minimaxai/minimax-m2.7",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
    ],
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from LLM");
  return content;
}
