import type { Context } from "hono";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getD1Binding } from "../env";

/**
 * Create a Drizzle DB instance from a raw D1 binding.
 * Used by the cron handler in wrap-worker.mjs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDb(binding: any) {
  return drizzleD1(binding, { schema });
}

/**
 * Get a Drizzle DB instance from the Hono request context.
 *
 * Uses Cloudflare D1 in all environments:
 * - Production: real D1 binding via Cloudflare Workers
 * - Local dev (`next dev`): local D1 via `initOpenNextCloudflareForDev()`
 *   which spins up miniflare with the wrangler.jsonc bindings.
 *
 * Migrations are applied via `wrangler d1 migrations apply`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(c: Context): any {
  const d1 = getD1Binding(c);
  if (!d1) {
    throw new Error(
      "D1 binding not found. Ensure the D1 database is bound in wrangler.jsonc (binding name: DB) " +
        "and that initOpenNextCloudflareForDev() is called in next.config.ts for local dev."
    );
  }
  return drizzleD1(d1, { schema });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
