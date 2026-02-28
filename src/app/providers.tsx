"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/client/components/toaster";
import { toastErrorFrom } from "@/client/lib/toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Use per-query error handler if provided via meta
            const handler = query.meta?.errorHandler as
              | ((err: Error) => void)
              | undefined;
            if (handler) {
              handler(error as Error);
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            // Mutations handle errors in their own onError callbacks,
            // but catch any that slip through without one
            if (!mutation.options.onError) {
              toastErrorFrom(error);
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
