import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env["OPENAI_API_KEY"],
});

export async function embedQuery(text: string): Promise<number[]> {
  const res = await client.embeddings.create({
    model: "nvidia/nv-embed-v1",
    input: text,
  });
  return res.data[0]!.embedding;
}
