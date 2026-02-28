/**
 * Post-build script that wraps the OpenNext worker output
 * to add a Cloudflare Cron Trigger (scheduled) handler.
 *
 * Run after `opennextjs-cloudflare build`:
 *   node scripts/wrap-worker.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const WORKER_PATH = resolve(".open-next/worker.js");

if (!existsSync(WORKER_PATH)) {
  console.error("❌ .open-next/worker.js not found — run opennextjs-cloudflare build first");
  process.exit(1);
}

const original = readFileSync(WORKER_PATH, "utf-8");

// Check if already wrapped (idempotent)
if (original.includes("__CRON_WRAPPED__")) {
  console.log("✅ Worker already wrapped with cron handler, skipping.");
  process.exit(0);
}

// We inject a scheduled handler that:
// 1. Imports drizzle-orm inline (already bundled in the worker context)
// 2. Calls the OpenRouter API to sync free models
// The handler gets the D1 binding from env.DB

const cronPatch = `
// __CRON_WRAPPED__ — Cron trigger for model sync (every 6 hours)
const _originalDefault = typeof module !== 'undefined' && module.exports?.default
  ? module.exports.default
  : (typeof exports !== 'undefined' ? exports.default : undefined);

// Wrap to add scheduled handler
const _wrappedExport = {
  ...(typeof _originalDefault === 'object' ? _originalDefault : {}),
  fetch: typeof _originalDefault === 'object' ? _originalDefault.fetch : (_originalDefault?.fetch || (async (req, env, ctx) => new Response("Not found", { status: 404 }))),
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/models");
        if (!res.ok) {
          console.error("[cron] OpenRouter API error:", res.status);
          return;
        }
        const json = await res.json();
        const allModels = json.data || [];

        // Filter: free + tool support + text capable
        const freeToolModels = allModels.filter((m) => {
          const isFree = m.pricing?.prompt === "0" && m.pricing?.completion === "0";
          const supportsTools = Array.isArray(m.supported_parameters) && m.supported_parameters.includes("tools");
          const isText = m.architecture?.input_modalities?.includes("text") && m.architecture?.output_modalities?.includes("text");
          return isFree && supportsTools && isText;
        });

        const db = env.DB;
        if (!db) {
          console.error("[cron] D1 binding not available");
          return;
        }

        // Ensure table exists
        await db.exec(\`CREATE TABLE IF NOT EXISTS models (
          id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, context_length INTEGER NOT NULL,
          max_completion_tokens INTEGER, description TEXT, is_default INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )\`);

        const now = new Date().toISOString();

        // Upsert each free model
        for (const m of freeToolModels) {
          await db.prepare(
            \`INSERT INTO models (id, name, context_length, max_completion_tokens, description, is_default, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?6)
             ON CONFLICT(id) DO UPDATE SET name=?2, context_length=?3, max_completion_tokens=?4, description=?5, updated_at=?6\`
          ).bind(
            m.id,
            m.name,
            m.context_length,
            m.top_provider?.max_completion_tokens ?? null,
            (m.description || "").slice(0, 500),
            now
          ).run();
        }

        // Ensure default model exists
        const DEFAULT_ID = "stepfun/step-3.5-flash:free";
        const hasDefault = freeToolModels.some((m) => m.id === DEFAULT_ID);
        if (!hasDefault) {
          const dflt = allModels.find((m) => m.id === DEFAULT_ID);
          if (dflt) {
            await db.prepare(
              \`INSERT INTO models (id, name, context_length, max_completion_tokens, description, is_default, created_at, updated_at)
               VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?6)
               ON CONFLICT(id) DO UPDATE SET name=?2, context_length=?3, max_completion_tokens=?4, description=?5, updated_at=?6\`
            ).bind(DEFAULT_ID, dflt.name, dflt.context_length, dflt.top_provider?.max_completion_tokens ?? null, (dflt.description || "").slice(0, 500), now).run();
          }
        }

        // Ensure at least one default is set
        const defaultRow = await db.prepare("SELECT id FROM models WHERE is_default = 1 LIMIT 1").first();
        if (!defaultRow) {
          await db.prepare("UPDATE models SET is_default = 1 WHERE id = ?1").bind(DEFAULT_ID).run();
        }

        // Remove stale models (but not the default)
        const validIds = freeToolModels.map((m) => m.id);
        if (!validIds.includes(DEFAULT_ID)) validIds.push(DEFAULT_ID);
        const allRows = await db.prepare("SELECT id FROM models").all();
        for (const row of (allRows.results || [])) {
          if (!validIds.includes(row.id)) {
            const isDefault = await db.prepare("SELECT is_default FROM models WHERE id = ?1").bind(row.id).first();
            if (!isDefault?.is_default) {
              await db.prepare("DELETE FROM models WHERE id = ?1").bind(row.id).run();
            }
          }
        }

        console.log("[cron] Model sync completed:", freeToolModels.length, "models");
      } catch (err) {
        console.error("[cron] Model sync failed:", err);
      }
    })());
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports.default = _wrappedExport;
  module.exports = { ...module.exports, default: _wrappedExport };
}
if (typeof exports !== 'undefined') {
  exports.default = _wrappedExport;
}
`;

writeFileSync(WORKER_PATH, original + "\n" + cronPatch, "utf-8");
console.log("✅ Worker wrapped with cron scheduled handler");
