import { toast as sonnerToast } from "sonner";
import {
  type ErrorCode,
  resolveErrorCode,
  getClientError,
} from "@/shared/errors";

// ── Re-export raw sonner for success/info/warning toasts ──
export { sonnerToast };

// ── Error toast helpers ──

/** Show an error toast from a known error code */
export function toastError(code: ErrorCode) {
  const entry = getClientError(code);
  sonnerToast.error(entry.message, {
    description: entry.description,
  });
}

/** Show an error toast from an Error object or string, auto-resolving the code */
export function toastErrorFrom(
  error: unknown,
  fallbackCode?: ErrorCode
) {
  const message =
    error instanceof Error ? error.message : String(error ?? "");

  // Try to detect HTTP status from error message (e.g. "Failed to fetch" = network)
  let httpStatus: number | undefined;
  if (message.toLowerCase().includes("failed to fetch")) {
    return toastError("NETWORK_ERROR" as ErrorCode);
  }

  const code = fallbackCode ?? resolveErrorCode(message, httpStatus);
  const entry = getClientError(code);

  // Prefer the server message if it's more specific than our default
  const displayMessage = message && message !== entry.message ? message : entry.message;

  sonnerToast.error(displayMessage, {
    description: entry.description,
  });
}

/** Show a success toast */
export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, { description });
}

/** Show an info toast */
export function toastInfo(message: string, description?: string) {
  sonnerToast.info(message, { description });
}

/** Show a warning toast */
export function toastWarning(message: string, description?: string) {
  sonnerToast.warning(message, { description });
}
