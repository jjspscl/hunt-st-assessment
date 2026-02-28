/**
 * Cloudflare Workers Cron Trigger handler.
 *
 * This module is imported by the worker entry-point wrapper
 * and runs on a `triggers.crons` schedule (every 6 hours).
 *
 * It fetches free, tool-compatible models from OpenRouter
 * and syncs them into the D1 `models` table.
 */
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { ModelsRepository } from "../domain/models/models.repository";
import { ModelsService } from "../domain/models/models.service";

export interface CronEnv {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DB: any;
  OPENROUTER_API_KEY?: string;
  [key: string]: unknown;
}

export async function handleScheduled(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _event: any,
  env: CronEnv,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
) {
  const promise = (async () => {
    try {
      const db = drizzleD1(env.DB, { schema });
      const apiKey = env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error("[cron] OPENROUTER_API_KEY not set, skipping model sync");
        return;
      }
      const service = new ModelsService(new ModelsRepository(db), apiKey);
      const result = await service.syncFromOpenRouter();
      console.log(
        `[cron] Model sync completed: ${result.synced} candidates, ${result.ok} ok, ${result.failed} failed`,
        result.models,
      );
    } catch (err) {
      console.error("[cron] Model sync failed:", err);
    }
  })();

  ctx.waitUntil(promise);
}
