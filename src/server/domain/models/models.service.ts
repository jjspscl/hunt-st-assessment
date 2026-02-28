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

/**
 * Quality ranking for known free models on OpenRouter.
 * Based on the OpenRouter leaderboard, community benchmarks,
 * and real-world tool-calling reliability (as of early 2026).
 *
 * Lower number = higher quality. Models not in this map get
 * a score derived from their context length (bigger ≈ better).
 */
const QUALITY_RANK: Record<string, number> = {
  // --- Tier 1: best free models (leaderboard top, large MoE, proven quality) ---
  "qwen/qwen3-235b-a22b-thinking-2507": 10,
  "qwen/qwen3-vl-235b-a22b-thinking": 12,
  "qwen/qwen3-vl-30b-a3b-thinking": 15,
  "arcee-ai/trinity-large-preview:free": 20,
  "nvidia/nemotron-nano-12b-v2-vl:free": 25,
  // --- Tier 2: solid free models ---
  "nvidia/nemotron-3-nano-30b-a3b:free": 30,
  "arcee-ai/trinity-mini:free": 35,
  "upstage/solar-pro-3:free": 40,
  "z-ai/glm-4.5-air:free": 45,
  "nvidia/nemotron-nano-9b-v2:free": 50,
  // --- Tier 3: usable / niche ---
  "openrouter/free": 55, // router, not a model itself
  "stepfun/step-3.5-flash:free": 60,
};

/**
 * Compute a sort order for a model.
 * Uses the curated QUALITY_RANK map first; if unknown, derives a
 * score from context length (larger context ≈ more capable ≈ lower number).
 */
function computeSortOrder(modelId: string, contextLength: number): number {
  if (QUALITY_RANK[modelId] !== undefined) return QUALITY_RANK[modelId];
  // Unknown models: 100–199 range, sorted by context length descending
  // A 200k-ctx model → ~100, a 4k-ctx model → ~199
  const ctxScore = Math.max(0, Math.min(99, 100 - Math.floor(contextLength / 2048)));
  return 100 + ctxScore;
}

/** Timeout for model health-check probe (ms) */
const TEST_TIMEOUT_MS = 15_000;

/**
 * Send a minimal tool-calling request to a model to verify it actually works.
 * Returns true if the model responds without error.
 */
async function probeModel(apiKey: string, modelId: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 20,
        messages: [
          { role: "user", content: "Reply with the word OK." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ping",
              description: "A no-op health check tool",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.log(`[models] probe FAIL ${modelId}: ${res.status} ${body.slice(0, 120)}`);
      return false;
    }

    // Consume the body to release the connection
    await res.text().catch(() => {});
    return true;
  } catch (err) {
    console.log(`[models] probe ERROR ${modelId}:`, (err as Error).message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export class ModelsService {
  constructor(
    private repo: ModelsRepository,
    private apiKey?: string,
  ) {}

  /** List all models (only "ok" status shown to users) */
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
   * Fetch free, tool-compatible models from OpenRouter,
   * health-check each one, and sync the working ones into the DB.
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
      const isFree =
        m.pricing.prompt === "0" &&
        m.pricing.completion === "0";
      const supportsTools = m.supported_parameters?.includes("tools");
      const isTextCapable =
        m.architecture?.input_modalities?.includes("text") &&
        m.architecture?.output_modalities?.includes("text");
      return isFree && supportsTools && isTextCapable;
    });

    // Build entries with quality-based sort order
    const entries = freeToolModels.map((m) => ({
      id: m.id,
      name: m.name,
      contextLength: m.context_length,
      maxCompletionTokens: m.top_provider?.max_completion_tokens ?? null,
      description: m.description?.slice(0, 500) ?? null,
      sortOrder: computeSortOrder(m.id, m.context_length),
    }));

    // Upsert all candidates first (so we have them in DB)
    await this.repo.upsertMany(entries);

    // Health-check each model (run in parallel batches of 5)
    if (this.apiKey) {
      console.log(`[models] Testing ${entries.length} candidate models...`);
      const BATCH_SIZE = 5;
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (entry) => {
            const ok = await probeModel(this.apiKey!, entry.id);
            return { id: entry.id, ok };
          })
        );
        for (const { id, ok } of results) {
          await this.repo.updateStatus(id, ok ? "ok" : "error");
          console.log(`[models]   ${ok ? "✓" : "✗"} ${id}`);
        }
      }
    }

    // Ensure default model always exists
    const defaultExists = entries.some((e) => e.id === DEFAULT_MODEL_ID);
    if (!defaultExists) {
      const defaultModel = allModels.find((m) => m.id === DEFAULT_MODEL_ID);
      if (defaultModel) {
        await this.repo.upsertMany([
          {
            id: defaultModel.id,
            name: defaultModel.name,
            contextLength: defaultModel.context_length,
            maxCompletionTokens: defaultModel.top_provider?.max_completion_tokens ?? null,
            description: defaultModel.description?.slice(0, 500) ?? null,
            sortOrder: computeSortOrder(DEFAULT_MODEL_ID, defaultModel.context_length),
          },
        ]);
      }
      // Default model is always marked ok
      await this.repo.updateStatus(DEFAULT_MODEL_ID, "ok");
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

    // Count how many passed
    const allRows = await this.repo.listAll();
    const okCount = allRows.filter((r: { status: string }) => r.status === "ok").length;
    const errorCount = allRows.filter((r: { status: string }) => r.status === "error").length;

    return {
      synced: entries.length,
      tested: entries.length,
      ok: okCount,
      failed: errorCount,
      models: allRows
        .filter((r: { status: string }) => r.status === "ok")
        .map((r: { id: string }) => r.id),
    };
  }
}
