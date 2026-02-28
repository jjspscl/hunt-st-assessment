-- Migration: Add is_thinking column to models table
-- Apply to Cloudflare D1 via: wrangler d1 execute llm-todo --remote --file=./migrations/0003_add_is_thinking.sql

ALTER TABLE models ADD COLUMN is_thinking INTEGER NOT NULL DEFAULT 0;
