import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const models = sqliteTable("models", {
  id: text("id").primaryKey(),                          // e.g. "stepfun/step-3.5-flash:free"
  name: text("name").notNull(),                         // human-readable name
  contextLength: integer("context_length").notNull(),
  maxCompletionTokens: integer("max_completion_tokens"),
  description: text("description"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  isThinking: integer("is_thinking", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(999),  // lower = better quality
  status: text("status", { enum: ["untested", "ok", "error"] })
    .notNull()
    .default("untested"),                               // health check result
  lastTestedAt: text("last_tested_at"),                  // ISO timestamp of last test
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/** The model we always seed as default */
export const DEFAULT_MODEL_ID = "stepfun/step-3.5-flash:free";
