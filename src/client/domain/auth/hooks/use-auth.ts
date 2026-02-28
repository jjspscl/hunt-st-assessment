"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AuthStatus } from "@/shared/types";
import { ErrorCode } from "@/shared/errors";
import { toastError, toastErrorFrom, toastSuccess } from "@/client/lib/toast";

async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch("/api/auth/status");
  if (!res.ok) throw new Error("Failed to check auth");
  return res.json();
}

export function useAuthStatus() {
  return useQuery({
    queryKey: ["auth", "status"],
    queryFn: fetchAuthStatus,
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Resolve specific error code from server response
        if (res.status === 429) throw Object.assign(new Error(data.error || "Too many attempts"), { code: ErrorCode.AUTH_RATE_LIMITED });
        if (res.status === 401) throw Object.assign(new Error(data.error || "Invalid password"), { code: ErrorCode.AUTH_INVALID_CREDENTIALS });
        throw new Error(data.error || "Login failed");
      }
      return data;
    },
    onSuccess: () => {
      toastSuccess("Signed in", "Welcome back!");
      queryClient.invalidateQueries({ queryKey: ["auth", "status"] });
    },
    onError: (err: Error & { code?: ErrorCode }) => {
      if (err.code) {
        toastError(err.code);
      } else {
        toastErrorFrom(err, ErrorCode.AUTH_LOGIN_FAILED);
      }
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      return res.json();
    },
    onSuccess: () => {
      toastSuccess("Signed out", "See you next time!");
      queryClient.invalidateQueries({ queryKey: ["auth", "status"] });
    },
    onError: (err: Error) => {
      toastErrorFrom(err, ErrorCode.AUTH_LOGOUT_FAILED);
    },
  });
}
