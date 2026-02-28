"use client";

import { useAuthStatus } from "@/client/domain/auth/hooks/use-auth";
import { LoginForm } from "@/client/domain/auth/components/login-form";
import { Loader2 } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If auth is not required (no SECRET_PASSWORD set), show the app directly
  if (data && !data.authRequired) {
    return <>{children}</>;
  }

  // If authenticated, show the app
  if (data?.authenticated) {
    return <>{children}</>;
  }

  // Otherwise, show login form
  return <LoginForm />;
}
