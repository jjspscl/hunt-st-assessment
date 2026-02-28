import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function createLlmClient(apiKey: string) {
  const openrouter = createOpenRouter({ apiKey });
  return openrouter("stepfun/step-3.5-flash:free");
}
