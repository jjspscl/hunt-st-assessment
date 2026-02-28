"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Styled Toaster — warm minimalist fintech with neo-brutalist influence.
 * Uses CSS variables from globals.css for full theme consistency.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-start gap-3 w-full rounded-sm border border-border bg-card text-card-foreground p-4 shadow-[2px_2px_0px_#1E1E1E] font-sans text-sm",
          title: "font-semibold tracking-tight text-foreground",
          description: "text-muted-foreground text-xs mt-0.5",
          actionButton:
            "rounded-sm bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold border border-primary shadow-[2px_2px_0px_#1E1E1E] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
          cancelButton:
            "rounded-sm border border-border text-muted-foreground px-2 py-1 text-xs font-semibold hover:text-foreground hover:border-foreground",
          error:
            "!border-destructive !bg-red-50 [&_[data-title]]:!text-destructive",
          success:
            "!border-green-600 !bg-green-50 [&_[data-title]]:!text-green-700",
          warning:
            "!border-amber-500 !bg-amber-50 [&_[data-title]]:!text-amber-700",
          info: "!border-primary !bg-orange-50 [&_[data-title]]:!text-primary",
        },
      }}
    />
  );
}
