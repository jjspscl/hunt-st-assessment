import type { Context } from "hono";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getD1Binding, type Env } from "../env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDb(binding: any) {
  // D1Database binding (Cloudflare)
  return drizzleD1(binding, { schema });
}

/**
 * Get a Drizzle DB instance from the request context.
 * - On Cloudflare Workers: uses the D1 binding from c.env.DB
 * - On local `next dev` (Node.js): uses better-sqlite3 via dynamic import
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

  // Local dev: use better-sqlite3
  if (!_localDb) {
    // Dynamic require for better-sqlite3 (only available in Node.js)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const path = require("path");
    const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");

    const dbPath = path.join(process.cwd(), ".local.sqlite");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");

    // Auto-create tables on first use (matching Drizzle schemas exactly)
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
