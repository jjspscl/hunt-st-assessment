"use client";

import { Skeleton } from "@/client/components/ui/skeleton";

export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area skeleton */}
      <div className="flex-1 overflow-hidden p-2 sm:p-3 md:p-4 space-y-4 sm:space-y-5">
        {/* Assistant message skeleton */}
        <div className="flex gap-2 sm:gap-3 max-w-[80%]">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-16 sm:h-20 w-full rounded-sm" />
          </div>
        </div>

        {/* User message skeleton */}
        <div className="flex gap-2 sm:gap-3 max-w-[70%] ml-auto flex-row-reverse">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full shrink-0" />
          <Skeleton className="h-9 sm:h-10 w-full rounded-sm" />
        </div>

        {/* Assistant message skeleton */}
        <div className="flex gap-2 sm:gap-3 max-w-[85%]">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-24 sm:h-28 w-full rounded-sm" />
          </div>
        </div>

        {/* User message skeleton */}
        <div className="flex gap-2 sm:gap-3 max-w-[60%] ml-auto flex-row-reverse">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full shrink-0" />
          <Skeleton className="h-9 sm:h-10 w-full rounded-sm" />
        </div>
      </div>

      {/* Input area placeholder */}
      <div className="border-t border-border bg-card shrink-0">
        <div className="flex items-center px-2 pt-1.5 sm:px-3 md:px-4 sm:pt-2">
          <Skeleton className="h-7 w-32" />
        </div>
        <div className="flex gap-2 sm:gap-3 px-2 pb-2 pt-1.5 sm:p-3 md:px-4 md:pb-4 md:pt-2">
          <Skeleton className="flex-1 h-10" />
          <Skeleton className="h-10 w-11" />
        </div>
      </div>
    </div>
  );
}
