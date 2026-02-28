"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/client/components/markdown";

interface ReasoningBlockProps {
  /** The combined reasoning text */
  text: string;
  /** Whether the reasoning is still streaming */
  isStreaming: boolean;
}

/**
 * Collapsible reasoning/thinking block for LLM models.
 * Auto-opens while streaming, user can toggle manually.
 * Neo-brutalist style matching the app theme.
 */
export function ReasoningBlock({ text, isStreaming }: ReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState(isStreaming);
  const [hasBeenManuallyToggled, setHasBeenManuallyToggled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-open while streaming, auto-close when done (unless user toggled)
  useEffect(() => {
    if (isStreaming && !hasBeenManuallyToggled) {
      setIsOpen(true);
    } else if (!isStreaming && !hasBeenManuallyToggled) {
      setIsOpen(false);
    }
  }, [isStreaming, hasBeenManuallyToggled]);

  const handleToggle = () => {
    setHasBeenManuallyToggled(true);
    setIsOpen((prev) => !prev);
  };

  if (!text.trim()) return null;

  return (
    <div className="mb-1.5">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1.5 text-[10px] sm:text-xs font-medium transition-colors",
          "text-muted-foreground/70 hover:text-muted-foreground",
          "cursor-pointer select-none"
        )}
      >
        <Brain className={cn(
          "h-3 w-3 shrink-0",
          isStreaming && "animate-pulse text-primary"
        )} />
        <span>{isStreaming ? "Thinking…" : "Thought process"}</span>
        <ChevronRight className={cn(
          "h-3 w-3 shrink-0 transition-transform duration-200",
          isOpen && "rotate-90"
        )} />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div
            ref={contentRef}
            className={cn(
              "mt-1.5 pl-2 border-l-2 text-[10px] sm:text-xs leading-relaxed",
              "text-muted-foreground/60",
              "max-h-40 overflow-y-auto",
              isStreaming
                ? "border-primary/40"
                : "border-border"
            )}
          >
            <Markdown compact>{text}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
