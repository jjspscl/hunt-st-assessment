"use client";

import { useTask } from "../hooks/use-task";
import { CheckCircle2, Circle, Clock, FileText, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm px-3 py-1.5 bg-card hover:border-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>

      <div className="space-y-2 border border-border rounded-sm p-4 bg-card">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
          <h1
            className={cn(
              "text-xl font-semibold tracking-tight",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Created {new Date(task.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2 tracking-tight">
          <FileText className="h-4 w-4" />
          Details ({details.length})
        </h2>
        {details.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-border rounded-sm p-4 bg-background">
            No details attached yet. Use the chat to add notes.
          </p>
        ) : (
          <div className="space-y-2">
            {details.map((detail) => (
              <div
                key={detail.id}
                className="rounded-sm border border-border p-3 text-sm space-y-1 bg-card"
              >
                <p className="whitespace-pre-wrap">{detail.content}</p>
                <p className="text-xs text-muted-foreground">
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
