import type { Context } from "hono";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getD1Binding } from "../env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDb(binding: any) {
  // D1Database binding (Cloudflare)
  return drizzleD1(binding, { schema });
}

/**
 * Get a Drizzle DB instance from the request context.
 * - On Cloudflare (via OpenNext): uses the D1 binding from getCloudflareContext()
 * - On local `next dev` (Node.js): uses better-sqlite3 via dynamic require
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _localDb: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(c: Context): any {
  // Try Cloudflare D1 first
  const d1 = getD1Binding(c);
  if (d1) {
    return drizzleD1(d1, { schema });
  }

  // Not on Cloudflare and not on Node.js — misconfigured
  if (typeof globalThis.process === "undefined" || !globalThis.process?.versions?.node) {
    throw new Error(
      "D1 binding not found. Ensure the D1 database is bound in wrangler.jsonc (binding name: DB)."
    );
  }

  // Local dev (Node.js only): lazy-load better-sqlite3
  if (!_localDb) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");

    const dbPath = path.join(process.cwd(), ".local.sqlite");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");

    // Auto-create tables on first use
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS task_details (
        id TEXT PRIMARY KEY NOT NULL,
        task_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY NOT NULL,
        messages_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS login_attempts (
        ip_address TEXT PRIMARY KEY NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt TEXT NOT NULL DEFAULT (datetime('now')),
        locked_until TEXT
      );
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY NOT NULL,
        response TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      );
    `);

    _localDb = drizzleSqlite(sqlite, { schema });
  }

  return _localDb;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
