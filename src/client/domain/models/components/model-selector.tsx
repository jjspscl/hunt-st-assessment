"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModels, useSetActiveModel, useSyncModels } from "../hooks/use-models";
import { toast } from "sonner";

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useModels();
  const setActive = useSetActiveModel();
  const sync = useSyncModels();

  const models = data?.models ?? [];
  const activeId = data?.activeId;
  const activeModel = models.find((m) => m.id === activeId);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(modelId: string) {
    if (modelId === activeId) {
      setIsOpen(false);
      return;
    }
    setActive.mutate(modelId, {
      onSuccess: () => {
        toast.success("Model switched", {
          description: models.find((m) => m.id === modelId)?.name ?? modelId,
        });
        setIsOpen(false);
      },
      onError: () => {
        toast.error("Failed to switch model");
      },
    });
  }

  function handleSync() {
    sync.mutate(undefined, {
      onSuccess: (result) => {
        toast.success("Models synced", {
          description: `${result.synced} compatible models found`,
        });
      },
      onError: () => {
        toast.error("Failed to sync models");
      },
    });
  }

  /** Extract short display name from model ID */
  function shortName(id: string) {
    // e.g. "stepfun/step-3.5-flash:free" → "step-3.5-flash"
    const slug = id.split("/").pop() ?? id;
    return slug.replace(/:free$/, "");
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 rounded-sm border border-border px-2 sm:px-3 py-1.5 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">Loading…</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 rounded-sm border px-2 sm:px-3 py-1.5 text-sm transition-colors max-w-45 sm:max-w-55",
          isOpen
            ? "border-foreground text-foreground"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
        )}
      >
        <Cpu className="h-4 w-4 shrink-0" />
        <span className="truncate hidden xs:inline sm:inline">
          {activeModel ? shortName(activeModel.id) : "Model"}
        </span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-70 max-w-85 rounded-sm border border-border bg-card shadow-[3px_3px_0px_#1E1E1E]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Select Model
            </span>
            <button
              type="button"
              onClick={handleSync}
              disabled={sync.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh models from OpenRouter"
            >
              <RefreshCw
                className={cn("h-3 w-3", sync.isPending && "animate-spin")}
              />
              Sync
            </button>
          </div>

          {/* Model list */}
          <div className="max-h-75 overflow-y-auto py-1">
            {models.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No models available.
                <br />
                <button
                  type="button"
                  onClick={handleSync}
                  className="mt-1 text-primary hover:underline"
                >
                  Sync from OpenRouter
                </button>
              </div>
            ) : (
              models.map((model) => {
                const isActive = model.id === activeId;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelect(model.id)}
                    disabled={setActive.isPending}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors flex flex-col gap-0.5",
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          isActive ? "bg-primary" : "bg-transparent"
                        )}
                      />
                      <span className="font-medium truncate">{shortName(model.id)}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {(model.contextLength / 1024).toFixed(0)}k ctx
                      </span>
                    </div>
                    {model.description && (
                      <span className="text-xs text-muted-foreground pl-3.5 line-clamp-1">
                        {model.description}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
