import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

export type User = { id: number; email: string; name: string; role: "admin" | "editor" };

type Status = { user: User | null; needsSetup: boolean; photoUpload: boolean };

type Session = Status & {
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>({ user: null, needsSetup: false, photoUpload: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Status>("/api/auth/status")
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const signedIn = useCallback((user: User) => setStatus((s) => ({ ...s, user, needsSetup: false })), []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ user: User }>("/api/auth/login", { method: "POST", json: { email, password } });
      signedIn(res.user);
    },
    [signedIn],
  );

  const setup = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api<{ user: User }>("/api/auth/setup", { method: "POST", json: { name, email, password } });
      signedIn(res.user);
    },
    [signedIn],
  );

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setStatus((s) => ({ ...s, user: null }));
  }, []);

  return (
    <SessionContext.Provider value={{ ...status, loading, login, setup, logout }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}
