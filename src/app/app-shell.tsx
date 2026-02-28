"use client";

import type { ReactNode } from "react";
import { Header } from "@/client/components/layout/header";
import { AuthGate } from "@/client/domain/auth/components/auth-gate";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-6xl mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
          <div className="h-full border border-border rounded-sm bg-card">
            {children}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
