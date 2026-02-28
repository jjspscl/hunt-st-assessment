-- Migration: Add models table for dynamic LLM model selection
-- Apply to Cloudflare D1 via: wrangler d1 execute llm-todo --remote --file=./migrations/0002_add_models.sql

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

-- Seed the default model
INSERT OR IGNORE INTO models (id, name, context_length, max_completion_tokens, description, is_default)
VALUES (
  'stepfun/step-3.5-flash:free',
  'StepFun Step 3.5 Flash',
  8192,
  4096,
  'Free tier model with reliable tool-calling support via OpenRouter.',
  1
);
