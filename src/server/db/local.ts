/**
 * Local development database using better-sqlite3.
 * This file is NEVER imported in the edge bundle — only loaded
 * dynamically at runtime via getDb() when running `next dev` in Node.js.
 */
import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _localDb: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalDb(): any {
  if (_localDb) return _localDb;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      context_length INTEGER NOT NULL,
      max_completion_tokens INTEGER,
      description TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  _localDb = drizzleSqlite(sqlite, { schema });
  return _localDb;
}
