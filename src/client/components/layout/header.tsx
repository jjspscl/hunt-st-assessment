"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, ListTodo, LogOut, Github } from "lucide-react";
import { useAuthStatus, useLogout } from "@/client/domain/auth/hooks/use-auth";

export function Header() {
  const pathname = usePathname();
  const { data: auth } = useAuthStatus();
  const logout = useLogout();

  const navItems = [
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/tasks", label: "Tasks", icon: ListTodo },
  ];

  return (
    <header className="border-b border-border bg-card">
      <div className="container max-w-6xl mx-auto flex h-11 sm:h-14 items-center px-2 sm:px-4 md:px-6 gap-1.5 sm:gap-4 md:gap-6">
        <Link href="/chat" className="font-semibold text-sm sm:text-lg tracking-tight mr-0.5 sm:mr-4 shrink-0">
          <span className="hidden sm:inline">Tracker</span>
          <span className="sm:hidden text-base">Tracker</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-sm px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_#1E1E1E]"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <a
            href="https://github.com/jjspscl/llm-todo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 rounded-sm border border-foreground bg-foreground text-background px-2 sm:px-3 py-1.5 text-sm shadow-[2px_2px_0px_#1E1E1E] hover:opacity-80 transition-all"
            aria-label="GitHub Repository"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          {auth?.authRequired && auth?.authenticated && (
            <button
              onClick={() => logout.mutate()}
              className="flex items-center gap-1.5 sm:gap-2 rounded-sm border border-border px-2 sm:px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
