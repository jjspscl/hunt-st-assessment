"use client";

import { type FormEvent, useRef, useEffect } from "react";
import { Send } from "lucide-react";

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

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-t border-border">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a message... (e.g., 'Create a task to buy groceries')"
        className="flex-1 resize-none rounded-sm border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-10 max-h-30"
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground border border-primary transition-all hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0px_#1E1E1E] disabled:pointer-events-none disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
