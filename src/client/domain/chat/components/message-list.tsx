"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3 border border-border rounded-sm p-8 bg-background">
          <Bot className="h-12 w-12 mx-auto opacity-40" />
          <p className="text-xl font-semibold tracking-tight text-foreground">Chat Task Tracker</p>
          <p className="text-sm max-w-md leading-relaxed">
            Send a message to create tasks, complete them, or add details.
            Try: &quot;I need to buy groceries, schedule a dentist appointment, and
            finish the quarterly report&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3 max-w-[85%]",
            message.role === "user" ? "ml-auto flex-row-reverse" : ""
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border",
              message.role === "user"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {message.role === "user" ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          <div
            className={cn(
              "rounded-sm border px-3 py-2 text-sm",
              message.role === "user"
                ? "bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_#1E1E1E]"
                : "bg-card border-border"
            )}
          >
            <p className="whitespace-pre-wrap">
              {message.parts
                ?.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
                .map((p, i) => <span key={i}>{p.text}</span>)}
            </p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
            <Bot className="h-4 w-4" />
          </div>
          <div className="rounded-sm border border-border px-3 py-2 bg-card">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
