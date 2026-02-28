"use client";

import { useTask } from "../hooks/use-task";
import { CheckCircle2, Circle, Clock, FileText, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Format detail content for display.
 * Detects inline numbered lists (e.g. "1) ... 2) ...") and adds line breaks.
 * Also handles "- " bullet patterns and "Step N:" patterns.
 */
function formatDetailContent(content: string): string {
  // Add newlines before numbered items like "2)", "3)", etc. (skip "1)" at start)
  let formatted = content.replace(/(?<!\n)\s+(\d+)\)\s/g, "\n$1) ");
  // Handle "Step N:" patterns
  formatted = formatted.replace(/(?<!\n)\s+(Step\s+\d+[:.]\s)/gi, "\n$1");
  // Handle bullet points mid-text
  formatted = formatted.replace(/(?<!\n)\s+([-•])\s+(?=[A-Z])/g, "\n$1 ");
  // Handle "Pro tip:" or "Note:" at the end
  formatted = formatted.replace(/(?<!\n)\s+(Pro tip:|Note:|Tip:|Important:)\s/gi, "\n\n$1 ");
  return formatted.trim();
}

interface TaskDetailViewProps {
  taskId: string;
}

export function TaskDetailView({ taskId }: TaskDetailViewProps) {
  const { data, isLoading, error } = useTask(taskId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 text-destructive text-sm">
        Failed to load task details
      </div>
    );
  }

  const { task, details } = data;
  const isCompleted = task.status === "completed";

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm px-2 sm:px-3 py-1 sm:py-1.5 bg-card hover:border-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Back to tasks
      </Link>

      <div className="space-y-2 border border-border rounded-sm p-3 sm:p-4 bg-card">
        <div className="flex items-start sm:items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
          )}
          <h1
            className={cn(
              "text-base sm:text-xl font-semibold tracking-tight break-words",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Created {new Date(task.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-xs sm:text-sm font-semibold flex items-center gap-2 tracking-tight">
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Details ({details.length})
        </h2>
        {details.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground border border-border rounded-sm p-3 sm:p-4 bg-background">
            No details attached yet. Use the chat to add notes.
          </p>
        ) : (
          <div className="space-y-2">
            {details.map((detail) => (
              <div
                key={detail.id}
                className="rounded-sm border border-border p-2.5 sm:p-3 text-xs sm:text-sm space-y-1.5 bg-card"
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{formatDetailContent(detail.content)}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {new Date(detail.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
