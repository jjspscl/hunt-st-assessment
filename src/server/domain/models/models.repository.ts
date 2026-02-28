import { eq } from "drizzle-orm";
import { models } from "./models.schema";
import type { Database } from "../../db";

export class ModelsRepository {
  constructor(private db: Database) {}

  /** Get all available models, sorted default first */
  async listAll() {
    return this.db
      .select()
      .from(models)
      .orderBy(models.isDefault)
      .all();
  }

  /** Get the currently active (default) model */
  async getDefault() {
    const rows = await this.db
      .select()
      .from(models)
      .where(eq(models.isDefault, true))
      .limit(1)
      .all();
    return rows[0] ?? null;
  }

  /** Set a model as the default (unsets all others) */
  async setDefault(modelId: string) {
    // Unset all
    await this.db
      .update(models)
      .set({ isDefault: false })
      .execute();
    // Set target
    await this.db
      .update(models)
      .set({ isDefault: true, updatedAt: new Date().toISOString() })
      .where(eq(models.id, modelId))
      .execute();
  }

  /** Upsert a batch of models from OpenRouter */
  async upsertMany(
    entries: Array<{
      id: string;
      name: string;
      contextLength: number;
      maxCompletionTokens: number | null;
      description: string | null;
    }>
  ) {
    const now = new Date().toISOString();
    for (const entry of entries) {
      // Check if exists
      const existing = await this.db
        .select()
        .from(models)
        .where(eq(models.id, entry.id))
        .limit(1)
        .all();

      if (existing.length > 0) {
        // Update metadata but preserve isDefault
        await this.db
          .update(models)
          .set({
            name: entry.name,
            contextLength: entry.contextLength,
            maxCompletionTokens: entry.maxCompletionTokens,
            description: entry.description,
            updatedAt: now,
          })
          .where(eq(models.id, entry.id))
          .execute();
      } else {
        await this.db
          .insert(models)
          .values({
            ...entry,
            isDefault: false,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      }
    }
  }

  /** Remove models that are no longer available */
  async removeStale(currentIds: string[]) {
    if (currentIds.length === 0) return;
    const all = await this.db.select({ id: models.id }).from(models).all();
    const staleIds = all
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !currentIds.includes(id));

    for (const id of staleIds) {
      // Don't remove the default
      const row = await this.db
        .select()
        .from(models)
        .where(eq(models.id, id))
        .limit(1)
        .all();
      if (row[0]?.isDefault) continue;

      await this.db.delete(models).where(eq(models.id, id)).execute();
    }
  }
}
