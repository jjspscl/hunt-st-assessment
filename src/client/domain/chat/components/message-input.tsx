"use client";

import { type FormEvent, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { ModelSelector } from "@/client/domain/models/components/model-selector";

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  // When the textarea gains focus (keyboard opens on mobile),
  // scroll the message list so the latest messages stay visible.
  const onFocus = () => {
    // Small delay to let the keyboard finish animating
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 300);
  };

  return (
    <div className="border-t border-border bg-card shrink-0">
      <div className="flex items-center px-2 pt-1.5 sm:px-3 md:px-4 sm:pt-2">
        <ModelSelector />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1.5 sm:p-3 md:px-4 md:pb-4 md:pt-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-sm border border-border bg-background px-2.5 py-2 sm:px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-10 max-h-30"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex items-center justify-center rounded-sm bg-primary px-3 py-2 sm:px-4 text-sm font-semibold text-primary-foreground border border-primary transition-all hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_#1E1E1E] disabled:pointer-events-none disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
