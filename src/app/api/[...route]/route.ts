import { handle } from "hono/vercel";
import app from "@/server";

// Edge runtime is required for Cloudflare Pages.
// Local dev (next dev) ignores this and runs in Node.js where better-sqlite3 works.
export const runtime = "edge";

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
