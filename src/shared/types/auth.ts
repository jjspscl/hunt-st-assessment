import { z } from "zod";

export const authStatusSchema = z.object({
  authRequired: z.boolean(),
  authenticated: z.boolean(),
});

export const loginRequestSchema = z.object({
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export type AuthStatus = z.infer<typeof authStatusSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
