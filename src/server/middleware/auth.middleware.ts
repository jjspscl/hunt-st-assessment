import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { Env } from "../env";
import { createDb } from "../db";
import { sessions } from "../db/schema";
import { eq, gt } from "drizzle-orm";

export const authMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const secretPassword = c.env.SECRET_PASSWORD;

    // No password configured → public mode, skip auth
    if (!secretPassword) {
      return next();
    }

    // Allow auth endpoints through without session
    const path = new URL(c.req.url).pathname;
    if (
      path === "/api/auth/login" ||
      path === "/api/auth/status" ||
      path === "/api/auth/logout"
    ) {
      return next();
    }

    // Validate session cookie
    const sessionToken = getCookie(c, "session");
    if (!sessionToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const db = createDb(c.env.DB);
    const now = new Date().toISOString();

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, sessionToken))
      .limit(1);

    if (!session || session.expiresAt < now) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return next();
  }
);
