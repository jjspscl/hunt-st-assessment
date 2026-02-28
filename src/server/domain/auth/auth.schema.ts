import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  expiresAt: text("expires_at").notNull(),
});

export const loginAttempts = sqliteTable("login_attempts", {
  ipAddress: text("ip_address").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  lastAttempt: text("last_attempt")
    .notNull()
    .default(sql`(datetime('now'))`),
  lockedUntil: text("locked_until"),
});
