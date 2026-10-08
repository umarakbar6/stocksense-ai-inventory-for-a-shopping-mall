import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type PropsWithChildren } from "react";
import { api, ApiError } from "../lib/api";
import type { User } from "../types";
type AuthContextValue = { user: User | null; isLoading: boolean; login: (email: string, password: string) => Promise<User>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ["auth", "me"], queryFn: () => api<{ user: User | null }>("/auth/me"), retry: false, staleTime: 60_000, throwOnError: false });
  const user = session.error instanceof ApiError && session.error.status === 401 ? null : session.data?.user ?? null;
  async function login(email: string, password: string) {
    const result = await api<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await queryClient.cancelQueries();
    queryClient.setQueryData(["auth", "me"], result);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
    return result.user;
  }
  async function logout() {
    await api<void>("/auth/logout", { method: "POST" });
    await queryClient.cancelQueries();
    // Keep the observed session query attached so it notifies every auth consumer.
    queryClient.setQueryData(["auth", "me"], { user: null });
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
  }
  return <AuthContext.Provider value={{ user, isLoading: session.isLoading, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider."); return context; }
