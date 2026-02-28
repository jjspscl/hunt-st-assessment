"use client";

import { useQuery } from "@tanstack/react-query";
import type { Task } from "@/shared/types";

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();
  return data.tasks;
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    refetchInterval: 5000, // Poll every 5s for freshness
  });
}
