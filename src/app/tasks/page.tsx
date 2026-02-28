"use client";

import { TaskList } from "@/client/domain/tasks/components/task-list";

export default function TasksPage() {
  return (
    <div className="flex flex-1 flex-col h-full p-4 max-w-2xl mx-auto w-full">
      <h1 className="text-lg font-semibold mb-4">Tasks</h1>
      <TaskList />
    </div>
  );
}
