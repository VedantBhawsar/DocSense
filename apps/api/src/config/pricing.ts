export type ModelPricing = {
  inputPer1kUsd: number;
  outputPer1kUsd: number;
};

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": {
    inputPer1kUsd: 0.0002,
    outputPer1kUsd: 0.0006,
  },
};

export function computeCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const p = MODEL_PRICING[model] ?? { inputPer1kUsd: 0, outputPer1kUsd: 0 };
  return (promptTokens / 1000) * p.inputPer1kUsd + (completionTokens / 1000) * p.outputPer1kUsd;
}
