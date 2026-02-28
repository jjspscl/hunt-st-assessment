import type { Context } from "hono";

/**
 * Minimal D1Database type for Cloudflare Workers.
 * Avoids needing @cloudflare/workers-types as a dependency.
 */
interface D1Database {
  prepare(query: string): unknown;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: unknown[]): Promise<unknown[]>;
  exec(query: string): Promise<unknown>;
}

/**
 * Cloudflare Workers bindings type.
 * DB is D1Database on CF, but may be absent in local dev.
 */
export interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  SECRET_PASSWORD?: string;
}

/**
 * Safely read an env var from c.env (Cloudflare) or process.env (local dev).
 * Works because `hono/vercel` handle() leaves c.env undefined in Node.js,
 * so we fall through to process.env.
 */
function readVar(c: Context, key: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (c.env as any)?.[key];
    if (val !== undefined && val !== null) return String(val);
  } catch {
    // c.env may throw if proxy-based
  }
  return typeof process !== "undefined" ? process.env[key] : undefined;
}

/** Get SECRET_PASSWORD from bindings or process.env */
export function getSecretPassword(c: Context): string | undefined {
  return readVar(c, "SECRET_PASSWORD");
}

/** Get OPENROUTER_API_KEY from bindings or process.env */
export function getOpenRouterApiKey(c: Context): string {
  return readVar(c, "OPENROUTER_API_KEY") ?? "";
}

/**
 * Get the raw D1 binding. Returns undefined in local dev.
 */
export function getD1Binding(c: Context): D1Database | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (c.env as any)?.DB;
    // D1Database is an object, not a string
    if (db && typeof db === "object" && typeof db.prepare === "function") {
      return db as D1Database;
    }
  } catch {
    // not available
  }
  return undefined;
}
