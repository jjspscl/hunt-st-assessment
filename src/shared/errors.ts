import { z } from "zod/v4";

// ── Error Code Enums ──

export const ErrorCode = {
  // Auth errors (1xxx)
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_PASSWORD_REQUIRED: "AUTH_PASSWORD_REQUIRED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_RATE_LIMITED: "AUTH_RATE_LIMITED",
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
  AUTH_LOGIN_FAILED: "AUTH_LOGIN_FAILED",
  AUTH_LOGOUT_FAILED: "AUTH_LOGOUT_FAILED",
  AUTH_STATUS_FAILED: "AUTH_STATUS_FAILED",

  // Task errors (2xxx)
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  TASK_INVALID_UPDATE: "TASK_INVALID_UPDATE",
  TASK_FETCH_FAILED: "TASK_FETCH_FAILED",
  TASK_COMPLETE_FAILED: "TASK_COMPLETE_FAILED",
  TASK_CREATE_FAILED: "TASK_CREATE_FAILED",

  // Chat errors (3xxx)
  CHAT_MESSAGES_REQUIRED: "CHAT_MESSAGES_REQUIRED",
  CHAT_STREAM_FAILED: "CHAT_STREAM_FAILED",
  CHAT_LLM_ERROR: "CHAT_LLM_ERROR",

  // System errors (9xxx)
  SYSTEM_RESET_FAILED: "SYSTEM_RESET_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ── Error Code Schema ──

export const errorCodeSchema = z.enum(Object.values(ErrorCode) as [string, ...string[]]);

// ── Error Map Entry ──

export const errorEntrySchema = z.object({
  code: errorCodeSchema,
  status: z.number(),
  message: z.string(),
  description: z.string().optional(),
});

export type ErrorEntry = z.infer<typeof errorEntrySchema>;

// ── Server Error Map ──
// Maps error codes to HTTP status codes and default messages returned by the API

export const SERVER_ERROR_MAP: Record<string, ErrorEntry> = {
  [ErrorCode.AUTH_UNAUTHORIZED]: {
    code: ErrorCode.AUTH_UNAUTHORIZED,
    status: 401,
    message: "Unauthorized",
    description: "You must be logged in to access this resource.",
  },
  [ErrorCode.AUTH_PASSWORD_REQUIRED]: {
    code: ErrorCode.AUTH_PASSWORD_REQUIRED,
    status: 400,
    message: "Password is required",
    description: "Please enter a password to continue.",
  },
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    status: 401,
    message: "Invalid password",
    description: "The password you entered is incorrect.",
  },
  [ErrorCode.AUTH_RATE_LIMITED]: {
    code: ErrorCode.AUTH_RATE_LIMITED,
    status: 429,
    message: "Too many attempts",
    description: "You've been rate limited. Please try again later.",
  },
  [ErrorCode.AUTH_SESSION_EXPIRED]: {
    code: ErrorCode.AUTH_SESSION_EXPIRED,
    status: 401,
    message: "Session expired",
    description: "Your session has expired. Please log in again.",
  },
  [ErrorCode.TASK_NOT_FOUND]: {
    code: ErrorCode.TASK_NOT_FOUND,
    status: 404,
    message: "Task not found",
    description: "The requested task does not exist.",
  },
  [ErrorCode.TASK_INVALID_UPDATE]: {
    code: ErrorCode.TASK_INVALID_UPDATE,
    status: 400,
    message: "Invalid update",
    description: "The task update contains invalid data.",
  },
  [ErrorCode.CHAT_MESSAGES_REQUIRED]: {
    code: ErrorCode.CHAT_MESSAGES_REQUIRED,
    status: 400,
    message: "Messages array is required",
    description: "Please provide a valid messages array.",
  },
  [ErrorCode.SYSTEM_RESET_FAILED]: {
    code: ErrorCode.SYSTEM_RESET_FAILED,
    status: 500,
    message: "System reset failed",
    description: "Failed to reset the system. Please try again.",
  },
  [ErrorCode.VALIDATION_ERROR]: {
    code: ErrorCode.VALIDATION_ERROR,
    status: 400,
    message: "Validation error",
    description: "The request contains invalid data.",
  },
} as const;

// ── Client Error Map ──
// Maps error codes to user-friendly toast messages shown on the client

export const CLIENT_ERROR_MAP: Record<string, ErrorEntry> = {
  [ErrorCode.AUTH_LOGIN_FAILED]: {
    code: ErrorCode.AUTH_LOGIN_FAILED,
    status: 0,
    message: "Login failed",
    description: "Could not sign in. Check your password and try again.",
  },
  [ErrorCode.AUTH_LOGOUT_FAILED]: {
    code: ErrorCode.AUTH_LOGOUT_FAILED,
    status: 0,
    message: "Logout failed",
    description: "Could not sign out. Please try again.",
  },
  [ErrorCode.AUTH_STATUS_FAILED]: {
    code: ErrorCode.AUTH_STATUS_FAILED,
    status: 0,
    message: "Auth check failed",
    description: "Could not verify your session.",
  },
  [ErrorCode.AUTH_UNAUTHORIZED]: {
    code: ErrorCode.AUTH_UNAUTHORIZED,
    status: 401,
    message: "Session expired",
    description: "Your session has expired. Redirecting to login…",
  },
  [ErrorCode.AUTH_RATE_LIMITED]: {
    code: ErrorCode.AUTH_RATE_LIMITED,
    status: 429,
    message: "Too many attempts",
    description: "Slow down — try again in a moment.",
  },
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    status: 401,
    message: "Wrong password",
    description: "The password you entered is incorrect.",
  },
  [ErrorCode.TASK_FETCH_FAILED]: {
    code: ErrorCode.TASK_FETCH_FAILED,
    status: 0,
    message: "Failed to load tasks",
    description: "Could not fetch your tasks. Retrying…",
  },
  [ErrorCode.TASK_NOT_FOUND]: {
    code: ErrorCode.TASK_NOT_FOUND,
    status: 404,
    message: "Task not found",
    description: "This task may have been deleted.",
  },
  [ErrorCode.TASK_COMPLETE_FAILED]: {
    code: ErrorCode.TASK_COMPLETE_FAILED,
    status: 0,
    message: "Could not complete task",
    description: "Something went wrong marking this task done.",
  },
  [ErrorCode.TASK_CREATE_FAILED]: {
    code: ErrorCode.TASK_CREATE_FAILED,
    status: 0,
    message: "Could not create task",
    description: "The task could not be created. Try again.",
  },
  [ErrorCode.CHAT_STREAM_FAILED]: {
    code: ErrorCode.CHAT_STREAM_FAILED,
    status: 0,
    message: "Chat error",
    description: "Something went wrong with the AI response.",
  },
  [ErrorCode.CHAT_LLM_ERROR]: {
    code: ErrorCode.CHAT_LLM_ERROR,
    status: 0,
    message: "AI unavailable",
    description: "The AI model could not respond. Try again shortly.",
  },
  [ErrorCode.NETWORK_ERROR]: {
    code: ErrorCode.NETWORK_ERROR,
    status: 0,
    message: "Network error",
    description: "Check your connection and try again.",
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    code: ErrorCode.UNKNOWN_ERROR,
    status: 0,
    message: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
  },
  [ErrorCode.SYSTEM_RESET_FAILED]: {
    code: ErrorCode.SYSTEM_RESET_FAILED,
    status: 500,
    message: "Reset failed",
    description: "Could not reset the system data.",
  },
} as const;

// ── Helpers ──

/** Resolve an error code from a server error message or HTTP status */
export function resolveErrorCode(
  errorMessage?: string,
  httpStatus?: number
): ErrorCode {
  if (errorMessage) {
    const msgLower = errorMessage.toLowerCase();

    if (msgLower.includes("unauthorized") || msgLower.includes("session expired"))
      return ErrorCode.AUTH_UNAUTHORIZED;
    if (msgLower.includes("password is required"))
      return ErrorCode.AUTH_PASSWORD_REQUIRED;
    if (msgLower.includes("invalid password") || msgLower.includes("invalid credentials"))
      return ErrorCode.AUTH_INVALID_CREDENTIALS;
    if (msgLower.includes("too many") || msgLower.includes("rate limit"))
      return ErrorCode.AUTH_RATE_LIMITED;
    if (msgLower.includes("task not found"))
      return ErrorCode.TASK_NOT_FOUND;
    if (msgLower.includes("invalid update"))
      return ErrorCode.TASK_INVALID_UPDATE;
    if (msgLower.includes("messages array"))
      return ErrorCode.CHAT_MESSAGES_REQUIRED;
  }

  if (httpStatus) {
    switch (httpStatus) {
      case 401:
        return ErrorCode.AUTH_UNAUTHORIZED;
      case 429:
        return ErrorCode.AUTH_RATE_LIMITED;
      case 404:
        return ErrorCode.TASK_NOT_FOUND;
      case 400:
        return ErrorCode.VALIDATION_ERROR;
    }
  }

  return ErrorCode.UNKNOWN_ERROR;
}

/** Get the client-facing error entry, falling back to UNKNOWN_ERROR */
export function getClientError(code: ErrorCode): ErrorEntry {
  return CLIENT_ERROR_MAP[code] ?? CLIENT_ERROR_MAP[ErrorCode.UNKNOWN_ERROR];
}

/** Get the server-facing error entry */
export function getServerError(code: ErrorCode): ErrorEntry | undefined {
  return SERVER_ERROR_MAP[code];
}
