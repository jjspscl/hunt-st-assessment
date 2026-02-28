import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function createLlmClient(apiKey: string) {
  const openrouter = createOpenRouter({ apiKey });
  return openrouter("meta-llama/llama-4-maverick:free");
}
