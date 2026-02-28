"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/client/components/layout/header";
import { AuthGate } from "@/client/domain/auth/components/auth-gate";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname === "/" || pathname === "/chat";

  return (
    <AuthGate>
      <div className="flex h-dvh flex-col bg-background overflow-hidden">
        <Header />
        {isChat ? (
          /* Chat: full-bleed on mobile, card on desktop */
          <main className="flex-1 flex flex-col min-h-0 sm:container sm:max-w-6xl sm:mx-auto sm:px-4 sm:py-4 md:px-6 md:py-6">
            <div className="flex-1 flex flex-col min-h-0 bg-card sm:border sm:border-border sm:rounded-sm">
              {children}
            </div>
          </main>
        ) : (
          /* Other pages: padded card layout */
          <main className="flex-1 overflow-y-auto container max-w-6xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
            <div className="border border-border rounded-sm bg-card">
              {children}
            </div>
          </main>
        )}
      </div>
    </AuthGate>
  );
}
