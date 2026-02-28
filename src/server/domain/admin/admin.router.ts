import { Hono } from "hono";
import type { Env } from "../../env";
import { getDb } from "../../db";
import { TasksRepository } from "../tasks/tasks.repository";
import { DetailsRepository } from "../details/details.repository";
import { ChatRepository } from "../chat/chat.repository";
import { AuthRepository } from "../auth/auth.repository";
import { clearIdempotencyKeys } from "../../lib/idempotency";

export const adminRouter = new Hono<{ Bindings: Env }>();

// POST /api/admin/reset
adminRouter.post("/reset", async (c) => {
  const db = getDb(c);

  // Clear all tables — order matters due to FK-like dependencies
  const detailsRepo = new DetailsRepository(db);
  const tasksRepo = new TasksRepository(db);
  const chatRepo = new ChatRepository(db);
  const authRepo = new AuthRepository(db);

  await detailsRepo.deleteAll();
  await tasksRepo.deleteAll();
  await chatRepo.deleteAll();
  await authRepo.deleteAllSessions();
  await authRepo.deleteAllLoginAttempts();
  await clearIdempotencyKeys(db);

  return c.json({ success: true, message: "All data has been reset" });
});
