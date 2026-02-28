import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Env } from "../../env";
import { getSecretPassword } from "../../env";
import { getDb } from "../../db";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { loginRequestSchema } from "@/shared/types";

export const authRouter = new Hono<{ Bindings: Env }>();

function getIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// GET /api/auth/status
authRouter.get("/status", async (c) => {
  const authRequired = !!getSecretPassword(c);

  if (!authRequired) {
    return c.json({ authRequired: false, authenticated: true });
  }

  const sessionToken = getCookie(c, "session");
  if (!sessionToken) {
    return c.json({ authRequired: true, authenticated: false });
  }

  const db = getDb(c);
  const service = new AuthService(new AuthRepository(db));
  const valid = await service.validateSession(sessionToken);

  return c.json({ authRequired: true, authenticated: valid });
});

// POST /api/auth/login
authRouter.post("/login", async (c) => {
  const secretPassword = getSecretPassword(c);
  if (!secretPassword) {
    return c.json({ success: true }); // No auth required
  }

  const body = await c.req.json();
  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Password is required" }, 400);
  }

  const ip = getIp(c);
  const db = getDb(c);
  const service = new AuthService(new AuthRepository(db));

  const result = await service.login(parsed.data.password, secretPassword, ip);

  if ("error" in result) {
    return c.json({ error: result.error }, result.status);
  }

  setCookie(c, "session", result.token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return c.json({ success: true });
});

// POST /api/auth/logout
authRouter.post("/logout", async (c) => {
  const sessionToken = getCookie(c, "session");

  if (sessionToken) {
    const db = getDb(c);
    const service = new AuthService(new AuthRepository(db));
    await service.logout(sessionToken);
  }

  deleteCookie(c, "session", { path: "/" });
  return c.json({ success: true });
});
