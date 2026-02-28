import { ModelsRepository } from "./models.repository";
import { DEFAULT_MODEL_ID } from "./models.schema";

/** Shape returned by OpenRouter GET /api/v1/models */
interface OpenRouterModel {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string; request: string; image: string };
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
  };
  top_provider: {
    is_moderated: boolean;
    context_length: number;
    max_completion_tokens: number | null;
  };
  supported_parameters: string[];
  description: string;
}

export class ModelsService {
  constructor(private repo: ModelsRepository) {}

  /** List all models */
  async list() {
    return this.repo.listAll();
  }

  /** Get the currently selected model ID, falling back to default */
  async getActiveModelId(): Promise<string> {
    const row = await this.repo.getDefault();
    return row?.id ?? DEFAULT_MODEL_ID;
  }

  /** Set a model as the active/default */
  async setActive(modelId: string) {
    return this.repo.setDefault(modelId);
  }

  /**
   * Fetch free, tool-compatible models from OpenRouter
   * and sync them into the DB.
   */
  async syncFromOpenRouter() {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as { data: OpenRouterModel[] };
    const allModels = json.data;

    // Filter: free models with tool support
    const freeToolModels = allModels.filter((m) => {
      // Free = all pricing fields are "0"
      const isFree =
        m.pricing.prompt === "0" &&
        m.pricing.completion === "0";

      // Must support tools (our app uses tool calling)
      const supportsTools = m.supported_parameters?.includes("tools");

      // Must be text→text or text→text+image (not image-only etc)
      const isTextCapable =
        m.architecture?.input_modalities?.includes("text") &&
        m.architecture?.output_modalities?.includes("text");

      return isFree && supportsTools && isTextCapable;
    });

    // Upsert into DB
    const entries = freeToolModels.map((m) => ({
      id: m.id,
      name: m.name,
      contextLength: m.context_length,
      maxCompletionTokens: m.top_provider?.max_completion_tokens ?? null,
      description: m.description?.slice(0, 500) ?? null,
    }));

    await this.repo.upsertMany(entries);

    // Ensure default model always exists
    const defaultExists = entries.some((e) => e.id === DEFAULT_MODEL_ID);
    if (!defaultExists) {
      // Add the default model even if it wasn't in the free list
      const defaultModel = allModels.find((m) => m.id === DEFAULT_MODEL_ID);
      if (defaultModel) {
        await this.repo.upsertMany([
          {
            id: defaultModel.id,
            name: defaultModel.name,
            contextLength: defaultModel.context_length,
            maxCompletionTokens: defaultModel.top_provider?.max_completion_tokens ?? null,
            description: defaultModel.description?.slice(0, 500) ?? null,
          },
        ]);
      }
    }

    // Ensure at least one default is set
    const current = await this.repo.getDefault();
    if (!current) {
      await this.repo.setDefault(DEFAULT_MODEL_ID);
    }

    // Clean up stale models
    const currentIds = entries.map((e) => e.id);
    if (!currentIds.includes(DEFAULT_MODEL_ID)) currentIds.push(DEFAULT_MODEL_ID);
    await this.repo.removeStale(currentIds);

    return { synced: entries.length, models: entries.map((e) => e.id) };
  }
}
