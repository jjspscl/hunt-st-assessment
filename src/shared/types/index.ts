// Schemas
export {
  taskSchema,
  taskStatusSchema,
  taskDetailSchema,
  taskWithDetailsSchema,
} from "./task";
export {
  chatMessageSchema,
  chatMessageRoleSchema,
  chatRequestSchema,
} from "./chat";
export {
  authStatusSchema,
  loginRequestSchema,
  loginResponseSchema,
} from "./auth";
export {
  apiResponseSchema,
  taskListResponseSchema,
  taskDetailResponseSchema,
  detailsListResponseSchema,
} from "./api";

// Error codes & maps
export {
  ErrorCode,
  errorCodeSchema,
  errorEntrySchema,
  SERVER_ERROR_MAP,
  CLIENT_ERROR_MAP,
  resolveErrorCode,
  getClientError,
  getServerError,
} from "../errors";
export type { ErrorEntry } from "../errors";

// Types
export type { Task, TaskStatus, TaskDetail, TaskWithDetails } from "./task";
export type { ChatMessageRole, ChatMessage, ChatRequest } from "./chat";
export type { AuthStatus, LoginRequest, LoginResponse } from "./auth";
export type {
  TaskListResponse,
  TaskDetailResponse,
  DetailsListResponse,
} from "./api";
