import { eq } from "drizzle-orm";
import { idempotencyKeys } from "../domain/idempotency/idempotency.schema";
import type { Database } from "../db";

/**
 * Generate an idempotency key from message content.
 * Uses SHA-256 hash of content + chatId + short timestamp bucket.
 * The 10-second bucket prevents rapid double-submits while allowing
 * the user to intentionally re-send the same message after a brief pause.
 */
export async function generateIdempotencyKey(
  content: string,
  chatId?: string
): Promise<string> {
  const bucket = Math.floor(Date.now() / (10 * 1000)); // 10-second buckets
  const raw = `${chatId ?? "global"}::${content}::${bucket}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if an idempotency key exists and return cached response.
 */
export async function checkIdempotencyKey(
  db: Database,
  key: string
): Promise<string | null> {
  const [record] = await db
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key))
    .limit(1);

  if (!record) return null;

  // Check expiry
  if (new Date(record.expiresAt) < new Date()) {
    // Expired — clean up
    await db.delete(idempotencyKeys).where(eq(idempotencyKeys.key, key));
    return null;
  }

  return record.response;
}

/**
 * Store an idempotency key with its response.
 */
export async function storeIdempotencyKey(
  db: Database,
  key: string,
  response: string
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 1000); // 60-second TTL

  await db
    .insert(idempotencyKeys)
    .values({
      key,
      response,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
    .onConflictDoNothing();
}

/**
 * Delete all idempotency keys.
 */
export async function clearIdempotencyKeys(db: Database): Promise<void> {
  await db.delete(idempotencyKeys);
}
