import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { authMiddleware } from "./middleware/auth.middleware";
import { authRouter } from "./domain/auth/auth.router";
import { tasksRouter } from "./domain/tasks/tasks.router";
import { detailsRouter } from "./domain/details/details.router";
import { chatRouter } from "./domain/chat/chat.router";
import { adminRouter } from "./domain/admin/admin.router";
import { modelsRouter } from "./domain/models/models.router";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Auth middleware — no-op when SECRET_PASSWORD is not set
app.use("*", authMiddleware);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Domain routers
app.route("/auth", authRouter);
app.route("/tasks", tasksRouter);
app.route("/tasks", detailsRouter);
app.route("/chat", chatRouter);
app.route("/admin", adminRouter);
app.route("/models", modelsRouter);

export default app;
export type AppType = typeof app;
