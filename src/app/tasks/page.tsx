"use client";

import { TaskList } from "@/client/domain/tasks/components/task-list";

export default function TasksPage() {
  return (
    <div className="flex flex-1 flex-col h-full p-3 sm:p-4 md:p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-4 sm:mb-6">Tasks</h1>
      <TaskList />
    </div>
  );
}
