"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";
import { ReasoningBlock } from "./reasoning-block";
import { Markdown } from "@/client/components/markdown";

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
      <div className="flex-1 flex items-center justify-center text-muted-foreground px-3 sm:px-4">
        <div className="text-center space-y-2 sm:space-y-3 border border-border rounded-sm p-4 sm:p-6 md:p-8 bg-background w-full max-w-md">
          <Bot className="h-8 w-8 sm:h-12 sm:w-12 mx-auto opacity-40" />
          <p className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">Chat Task Tracker</p>
          <p className="text-xs sm:text-sm max-w-md leading-relaxed">
            Send a message to create tasks, complete them, or add details.
            <span className="hidden sm:inline"> Try: &quot;I need to buy groceries, schedule a dentist appointment, and
            finish the quarterly report&quot;</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-[85%] md:max-w-[80%]",
            message.role === "user" ? "ml-auto flex-row-reverse" : ""
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-border",
              message.role === "user"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {message.role === "user" ? (
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </div>
          <div
            className={cn(
              "rounded-sm border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm",
              message.role === "user"
                ? "bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_#1E1E1E]"
                : "bg-card border-border"
            )}
          >
            {/* Reasoning block for assistant messages with thinking parts */}
            {message.role === "assistant" && (() => {
              const reasoningParts = message.parts?.filter(
                (p): p is Extract<typeof p, { type: "reasoning" }> => p.type === "reasoning"
              ) ?? [];
              if (reasoningParts.length === 0) return null;
              const combinedText = reasoningParts.map((p) => p.text).join("");
              const isStreaming = reasoningParts.some((p) => p.state === "streaming");
              return <ReasoningBlock text={combinedText} isStreaming={isStreaming} />;
            })()}
            {message.role === "user" ? (
              <div className="whitespace-pre-wrap">
                {message.parts
                  ?.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
                  .map((p, i) => (
                    <span key={i}>{p.text}</span>
                  ))}
              </div>
            ) : (
              <div>
                {message.parts
                  ?.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
                  .map((p, i) => (
                    <Markdown key={i}>{p.text}</Markdown>
                  ))}
              </div>
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-2 sm:gap-3">
          <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
            <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          <div className="rounded-sm border border-border px-2.5 py-1.5 sm:px-3 sm:py-2 bg-card">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
