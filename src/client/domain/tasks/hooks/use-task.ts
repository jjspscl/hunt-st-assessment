"use client";

import { useQuery } from "@tanstack/react-query";
import type { Task, TaskDetail } from "@/shared/types";

async function fetchTask(
  id: string
): Promise<{ task: Task; details: TaskDetail[] }> {
  const res = await fetch(`/api/tasks/${id}`);
  if (!res.ok) throw new Error("Failed to fetch task");
  return res.json();
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => fetchTask(id),
    enabled: !!id,
  });
}
