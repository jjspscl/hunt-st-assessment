import { z } from "zod";

export const chatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const chatMessageSchema = z.object({
  id: z.string(),
  role: chatMessageRoleSchema,
  content: z.string(),
  createdAt: z.string(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1),
  idempotencyKey: z.string().optional(),
});

export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
