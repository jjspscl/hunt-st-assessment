"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Model {
  id: string;
  name: string;
  contextLength: number;
  maxCompletionTokens: number | null;
  description: string | null;
  isDefault: boolean;
}

interface ModelsResponse {
  models: Model[];
  activeId: string;
}

async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch("/api/models");
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

async function setActiveModel(modelId: string): Promise<void> {
  const res = await fetch("/api/models/active", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelId }),
  });
  if (!res.ok) throw new Error("Failed to set active model");
}

async function syncModels(): Promise<{ synced: number }> {
  const res = await fetch("/api/models/sync", { method: "POST" });
  if (!res.ok) throw new Error("Failed to sync models");
  return res.json();
}

export function useModels() {
  return useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useSetActiveModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setActiveModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

export function useSyncModels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncModels,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}
