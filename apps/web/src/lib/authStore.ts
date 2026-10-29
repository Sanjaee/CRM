import { create } from "zustand";
import { UserProfile } from "./types";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize user profile from localStorage if in browser
  let initialUser: UserProfile | null = null;

  if (typeof window !== "undefined") {
    // Clean up any legacy exposed JWT from localStorage
    localStorage.removeItem("wahana_token");

    const storedUser = localStorage.getItem("wahana_user");
    if (storedUser) {
      try {
        initialUser = JSON.parse(storedUser);
      } catch {
        // ignore malformed JSON
      }
    }
  }

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    login: (user: UserProfile) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("wahana_user", JSON.stringify(user));
      }
      set({ user, isAuthenticated: true });
    },
    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("wahana_user");
        // Clear server HttpOnly cookie session
        fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
      }
      set({ user: null, isAuthenticated: false });
    },
    hasPermission: (permission: string) => {
      const user = get().user;
      if (!user) return false;
      if (user.role === "Administrator" || user.permissions.includes("FullAccess")) return true;
      return user.permissions.includes(permission);
    },
  };
});
