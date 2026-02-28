import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { UIMessage } from "ai";
import type { Env } from "../../env";
import { getOpenRouterApiKey } from "../../env";
import { getDb } from "../../db";
import { ChatService } from "./chat.service";
import { ErrorCode } from "@/shared/errors";

export const chatRouter = new Hono<{ Bindings: Env }>();

/**
 * Derive a per-user chat ID from the session token (authenticated) or IP (public mode).
 * Uses a simple hash to keep the ID compact and URL-safe.
 */
function deriveChatId(c: { req: { header: (name: string) => string | undefined } }, sessionToken: string | undefined): string {
  if (sessionToken) {
    return `session:${sessionToken.slice(0, 16)}`;
  }
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "anonymous";
  return `ip:${ip}`;
}

// GET /api/chat  —  returns persisted conversation history for this user
chatRouter.get("/", async (c) => {
  const sessionToken = getCookie(c, "session");
  const chatId = deriveChatId(c, sessionToken);

  const db = getDb(c);
  const service = new ChatService(db, getOpenRouterApiKey(c));
  const messages = await service.loadConversation(chatId);
  return c.json({ messages });
});

// POST /api/chat  —  receives { messages: UIMessage[] } from @ai-sdk/react useChat
chatRouter.post("/", async (c) => {
  const body = await c.req.json();
  const messages: UIMessage[] | undefined = body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages array is required", code: ErrorCode.CHAT_MESSAGES_REQUIRED }, 400);
  }

  const sessionToken = getCookie(c, "session");
  const chatId = deriveChatId(c, sessionToken);

  const db = getDb(c);
  const service = new ChatService(db, getOpenRouterApiKey(c));

  const result = await service.processMessages(messages, chatId);

  if (result.type === "cached") {
    return c.json({
      role: "assistant",
      content: result.response,
      cached: true,
    });
  }

  // Consume stream so onFinish fires even if client disconnects
  result.result.consumeStream();

  // Return AI SDK v6 UIMessage stream response with persistence via onFinish
  const response = result.result.toUIMessageStreamResponse({
    sendReasoning: true,
    originalMessages: result.originalMessages,
    onFinish: async ({ messages: finalMessages }) => {
      // Persist the full UIMessage[] conversation snapshot for this user
      await result.chatRepo.saveConversation(finalMessages, chatId);
    },
  });
  return response;
});
