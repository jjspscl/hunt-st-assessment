"use client";

import type { Task } from "@/shared/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const isCompleted = task.status === "completed";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-sm border border-border p-3 transition-colors",
        isCompleted ? "bg-muted/40 opacity-75" : "bg-card hover:shadow-[2px_2px_0px_#1E1E1E] hover:translate-x-[-1px] hover:translate-y-[-1px]"
      )}
    >
      <button
        onClick={() => !isCompleted && completeMutation.mutate()}
        disabled={isCompleted || completeMutation.isPending}
        className="shrink-0 text-muted-foreground hover:text-primary disabled:cursor-default transition-colors"
        title={isCompleted ? "Completed" : "Mark as completed"}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <Link
        href={`/tasks/${task.id}`}
        className="flex-1 min-w-0"
      >
        <p
          className={cn(
            "text-sm font-medium truncate",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3" />
          {new Date(task.createdAt).toLocaleDateString()}
        </p>
      </Link>
    </div>
  );
}
