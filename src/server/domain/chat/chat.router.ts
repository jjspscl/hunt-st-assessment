import { Hono } from "hono";
import type { Env } from "../../env";
import { createDb } from "../../db";
import { ChatService } from "./chat.service";
import { chatRequestSchema } from "@/shared/types";

export const chatRouter = new Hono<{ Bindings: Env }>();

// POST /api/chat
chatRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Message is required" }, 400);
  }

  const db = createDb(c.env.DB);
  const service = new ChatService(db, c.env.OPENROUTER_API_KEY);

  const result = await service.processMessage(parsed.data.message);

  if (result.type === "cached") {
    // Return cached response as a simple JSON response
    return c.json({
      role: "assistant",
      content: result.response,
      cached: true,
    });
  }

  // Return streaming response
  const response = result.result.toDataStreamResponse();
  return response;
});
