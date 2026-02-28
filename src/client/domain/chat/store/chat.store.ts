import { create } from "zustand";

interface ChatStore {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
