import { handle } from "hono/vercel";
import app from "@/server";

// Use Node.js runtime for local dev (better-sqlite3 is a native module).
// On Cloudflare Pages, runtime is always edge regardless of this setting.
export const runtime = "nodejs";

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
