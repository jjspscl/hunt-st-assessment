"use client";

import { useState } from "react";
import { useLogin } from "../hooks/use-auth";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    login.mutate(password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 bg-background">
      <div className="w-full max-w-sm space-y-5 sm:space-y-6 border border-border rounded-sm bg-card p-5 sm:p-8">
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-sm border border-border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              disabled={login.isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
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
