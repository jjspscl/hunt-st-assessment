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
 * Get Cloudflare Pages request context (bindings & env).
 * Returns undefined when running outside Cloudflare Pages (local dev).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCfEnv(): Record<string, any> | undefined {
  try {
    // @cloudflare/next-on-pages provides runtime bindings via getRequestContext()
    const { getRequestContext } = require("@cloudflare/next-on-pages");
    return getRequestContext()?.env;
  } catch {
    return undefined;
  }
}

/**
 * Safely read an env var.
 * Priority: Cloudflare Pages context → c.env (Hono) → process.env (local dev).
 */
function readVar(c: Context, key: string): string | undefined {
  // 1. Cloudflare Pages runtime bindings
  const cfEnv = getCfEnv();
  if (cfEnv) {
    const val = cfEnv[key];
    if (val !== undefined && val !== null && typeof val === "string") return val;
  }

  // 2. Hono c.env (Cloudflare Workers direct)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (c.env as any)?.[key];
    if (val !== undefined && val !== null) return String(val);
  } catch {
    // c.env may throw if proxy-based
  }

  // 3. Node.js process.env (local dev)
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
 * Checks Cloudflare Pages context first, then Hono c.env.
 */
export function getD1Binding(c: Context): D1Database | undefined {
  // 1. Cloudflare Pages runtime context
  const cfEnv = getCfEnv();
  if (cfEnv?.DB && typeof cfEnv.DB === "object" && typeof cfEnv.DB.prepare === "function") {
    return cfEnv.DB as D1Database;
  }

  // 2. Hono c.env (Cloudflare Workers direct)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (c.env as any)?.DB;
    if (db && typeof db === "object" && typeof db.prepare === "function") {
      return db as D1Database;
    }
  } catch {
    // not available
  }
  return undefined;
}
