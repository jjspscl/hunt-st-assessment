"use client";

import type { ReactNode } from "react";
import { Header } from "@/client/components/layout/header";
import { AuthGate } from "@/client/domain/auth/components/auth-gate";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </AuthGate>
  );
}
