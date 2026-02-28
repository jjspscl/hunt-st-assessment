"use client";

import { TaskList } from "@/client/domain/tasks/components/task-list";
import { ResetButton } from "@/client/domain/tasks/components/reset-button";

export default function TasksPage() {
  return (
    <div className="flex flex-1 flex-col h-full p-3 sm:p-4 md:p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tasks</h1>
        <ResetButton />
      </div>
      <TaskList />
    </div>
  );
}
