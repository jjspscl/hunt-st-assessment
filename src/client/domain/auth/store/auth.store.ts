import { create } from "zustand";

interface AuthStore {
  /** Optimistic local flag; authoritative state is from useAuthStatus query */
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
}));
