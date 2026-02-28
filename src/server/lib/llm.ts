import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { wrapLanguageModel, extractReasoningMiddleware } from "ai";

const DEFAULT_MODEL = "stepfun/step-3.5-flash:free";

/**
 * Models known to embed reasoning inside <think>…</think> tags in text output
 * rather than using OpenRouter's native reasoning API.
 * These need extractReasoningMiddleware to split reasoning from text.
 */
const THINK_TAG_MODELS = [
  "qwen/qwen3-",       // Qwen3 family uses <think> tags
];

function usesThinkTags(modelId: string): boolean {
  return THINK_TAG_MODELS.some((prefix) => modelId.startsWith(prefix));
}

export function createLlmClient(
  apiKey: string,
  modelId?: string,
  isThinking?: boolean,
) {
  const openrouter = createOpenRouter({ apiKey });
  const id = modelId ?? DEFAULT_MODEL;

  // For thinking models, enable reasoning via OpenRouter's native parameter
  if (isThinking) {
    const baseModel = openrouter(id, {
      reasoning: { enabled: true, effort: "medium" },
    });

    // Additionally wrap with middleware if the model uses <think> tags
    // (handles edge cases where some reasoning leaks into text)
    if (usesThinkTags(id)) {
      return wrapLanguageModel({
        model: baseModel,
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      });
    }

    return baseModel;
  }

  return openrouter(id);
}
