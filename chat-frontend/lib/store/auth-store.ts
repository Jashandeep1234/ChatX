import { create } from "zustand";
import type { UserResponse } from "@/types";

interface AuthState {
  accessToken: string | null;
  user: UserResponse | null;
  initializing: boolean;
  setSession: (token: string, user: UserResponse) => void;
  clearSession: () => void;
  setInitializing: (v: boolean) => void;
  setUser: (u: UserResponse | null) => void;
}

/**
 * Access token is kept in memory only (never persisted).
 * Refresh token is an httpOnly cookie managed by the backend.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  initializing: true,
  setSession: (token, user) => set({ accessToken: token, user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setInitializing: (v) => set({ initializing: v }),
  setUser: (u) => set({ user: u }),
}));
