"use client";

import { useState } from "react";
import { useLogin } from "../hooks/use-auth";
import { Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    login.mutate(password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6 border border-border rounded-sm bg-card p-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Chat Task Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Enter the password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              disabled={login.isPending}
            />
          </div>

          {login.isError && (
            <p className="text-sm text-destructive font-medium">
              {login.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending || !password.trim()}
            className="w-full rounded-sm bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground border border-primary shadow-[2px_2px_0px_#1E1E1E] transition-all hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
          >
            {login.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
