"use client";

import { ChevronDown, Cpu, RefreshCw, Brain, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModels, useSetActiveModel, useSyncModels } from "../hooks/use-models";
import { toast } from "sonner";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/client/components/ui/popover";

export function ModelSelector() {
  const { data, isLoading } = useModels();
  const setActive = useSetActiveModel();
  const sync = useSyncModels();

  const models = data?.models ?? [];
  const activeId = data?.activeId;
  const activeModel = models.find((m) => m.id === activeId);

  function handleSelect(modelId: string) {
    if (modelId === activeId) return;
    setActive.mutate(modelId, {
      onSuccess: () => {
        toast.success("Model switched", {
          description: models.find((m) => m.id === modelId)?.name ?? modelId,
        });
      },
      onError: () => toast.error("Failed to switch model"),
    });
  }

  function handleSync() {
    sync.mutate(undefined, {
      onSuccess: (result) =>
        toast.success("Models synced", {
          description: `${result.synced} compatible models found`,
        }),
      onError: () => toast.error("Failed to sync models"),
    });
  }

  function shortName(id: string) {
    const slug = id.split("/").pop() ?? id;
    return slug.replace(/:free$/, "");
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 rounded-sm border border-border px-2 sm:px-3 py-1 text-xs sm:text-sm text-muted-foreground">
        <Cpu className="h-3.5 w-3.5 animate-pulse" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <Popover>
      {/* ── Trigger ── */}
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs sm:text-sm font-medium transition-all max-w-52 sm:max-w-60",
            "border-border text-muted-foreground",
            "hover:text-foreground hover:border-foreground",
            "data-[state=open]:border-foreground data-[state=open]:text-foreground data-[state=open]:bg-background data-[state=open]:shadow-[2px_2px_0px_#1E1E1E]"
          )}
        >
          <Cpu className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {activeModel ? shortName(activeModel.id) : "Select model"}
          </span>
          {activeModel?.isThinking && (
            <Brain className="h-3 w-3 shrink-0 text-primary/70" />
          )}
          <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
        </button>
      </PopoverTrigger>

      {/* ── Content ── */}
      <PopoverContent side="top" align="start" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Model
          </span>
          <button
            type="button"
            onClick={handleSync}
            disabled={sync.isPending}
            className="flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-3 w-3", sync.isPending && "animate-spin")}
            />
            Sync
          </button>
        </div>

        {/* Model list */}
        <div className="max-h-[50vh] sm:max-h-72 overflow-y-auto">
          {models.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No models available.
              <br />
              <button
                type="button"
                onClick={handleSync}
                className="mt-2 text-primary font-medium hover:underline"
              >
                Sync from OpenRouter
              </button>
            </div>
          ) : (
            <div className="py-1">
              {models.map((model) => {
                const isActive = model.id === activeId;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelect(model.id)}
                    disabled={setActive.isPending}
                    className={cn(
                      "w-full text-left px-3 py-2 transition-colors group",
                      isActive
                        ? "bg-primary/8 border-l-2 border-l-primary"
                        : "border-l-2 border-l-transparent hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex items-center justify-center h-4 w-4 shrink-0 rounded-sm border",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border group-hover:border-muted-foreground"
                        )}
                      >
                        {isActive && <Check className="h-3 w-3" />}
                      </span>

                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {shortName(model.id)}
                      </span>

                      {model.isThinking && (
                        <span className="flex items-center gap-0.5 shrink-0 rounded-sm bg-primary/10 border border-primary/20 px-1 py-px">
                          <Brain className="h-2.5 w-2.5 text-primary" />
                          <span className="text-[10px] font-medium text-primary">
                            Think
                          </span>
                        </span>
                      )}

                      <span className="ml-auto text-[11px] font-mono text-muted-foreground/70 shrink-0">
                        {(model.contextLength / 1024).toFixed(0)}k
                      </span>
                    </div>

                    {model.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 pl-6 line-clamp-1">
                        {model.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeModel && (
          <div className="border-t border-border px-3 py-2 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">
              Active:{" "}
              <span className="font-medium text-foreground">
                {shortName(activeModel.id)}
              </span>
              {" · "}
              {(activeModel.contextLength / 1024).toFixed(0)}k context
              {activeModel.isThinking && " · reasoning"}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
