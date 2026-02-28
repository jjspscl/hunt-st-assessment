import { Hono } from "hono";
import type { UIMessage } from "ai";
import type { Env } from "../../env";
import { getOpenRouterApiKey } from "../../env";
import { getDb } from "../../db";
import { ChatService } from "./chat.service";
import { ErrorCode } from "@/shared/errors";

export const chatRouter = new Hono<{ Bindings: Env }>();

// POST /api/chat  —  receives { messages: UIMessage[] } from @ai-sdk/react useChat
chatRouter.post("/", async (c) => {
  const body = await c.req.json();
  const messages: UIMessage[] | undefined = body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages array is required", code: ErrorCode.CHAT_MESSAGES_REQUIRED }, 400);
  }

  const db = getDb(c);
  const service = new ChatService(db, getOpenRouterApiKey(c));

  const result = await service.processMessages(messages);

  if (result.type === "cached") {
    return c.json({
      role: "assistant",
      content: result.response,
      cached: true,
    });
  }

  // Return AI SDK v6 UIMessage stream response
  const response = result.result.toUIMessageStreamResponse();
  return response;
});
