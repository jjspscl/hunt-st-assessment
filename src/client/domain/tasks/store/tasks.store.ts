import { create } from "zustand";

interface TasksStore {
  selectedTaskId: string | null;
  filterStatus: "all" | "pending" | "completed";
  setSelectedTask: (id: string | null) => void;
  setFilterStatus: (status: "all" | "pending" | "completed") => void;
}

export const useTasksStore = create<TasksStore>((set) => ({
  selectedTaskId: null,
  filterStatus: "all",
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
}));
