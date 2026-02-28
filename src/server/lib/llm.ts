import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const DEFAULT_MODEL = "stepfun/step-3.5-flash:free";

export function createLlmClient(apiKey: string, modelId?: string) {
  const openrouter = createOpenRouter({ apiKey });
  return openrouter(modelId ?? DEFAULT_MODEL);
}
