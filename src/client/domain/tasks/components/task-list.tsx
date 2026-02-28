"use client";

import { useTasks } from "../hooks/use-tasks";
import { TaskCard } from "./task-card";
import { useTasksStore } from "../store/tasks.store";
import { Loader2, ListTodo } from "lucide-react";

export function TaskList() {
  const { data: tasks, isLoading, error } = useTasks();
  const { filterStatus, setFilterStatus } = useTasksStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive text-sm">
        Failed to load tasks: {error.message}
      </div>
    );
  }

  const filteredTasks =
    filterStatus === "all"
      ? tasks
      : tasks?.filter((t) => t.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {!filteredTasks || filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ListTodo className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">No tasks yet</p>
          <p className="text-xs">Use the chat to create tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
