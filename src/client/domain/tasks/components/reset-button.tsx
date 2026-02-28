"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

async function resetAll(): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/admin/reset", { method: "POST" });
  if (!res.ok) throw new Error("Reset failed");
  return res.json();
}

export function ResetButton() {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: resetAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("All data has been reset");
      setConfirming(false);
    },
    onError: () => {
      toast.error("Failed to reset data");
      setConfirming(false);
    },
  });

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Sure?</span>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-sm border border-destructive bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-all"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Reset"
          )}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={mutation.isPending}
          className="rounded-sm border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground transition-all bg-card"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-sm border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive transition-all bg-card flex items-center gap-1.5"
    >
      <RotateCcw className="h-3 w-3" />
      Reset
    </button>
  );
}
