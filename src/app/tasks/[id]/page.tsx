"use client";

export const runtime = "edge";

import { use } from "react";
import { TaskDetailView } from "@/client/domain/tasks/components/task-detail";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex flex-1 flex-col h-full p-3 sm:p-4 md:p-6 max-w-2xl mx-auto w-full">
      <TaskDetailView taskId={id} />
    </div>
  );
}
