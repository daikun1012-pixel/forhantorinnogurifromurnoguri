import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getStoredUserId, setStoredUserId, type AppConfig } from "@/lib/api";
import type { SessionInfo } from "@/types";

interface SessionState {
  loading: boolean;
  session: SessionInfo | null;
  config: AppConfig | null;
  login: (name: string) => Promise<void>;
  loginWithCode: (code: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);

  const refresh = useCallback(async () => {
    if (!getStoredUserId()) {
      setSession(null);
      return;
    }
    try {
      setSession(await api.me());
    } catch {
      setStoredUserId(null);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    void api.getConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (name: string) => {
      const user = await api.login(name);
      setStoredUserId(user.id);
      await refresh();
    },
    [refresh],
  );

  const loginWithCode = useCallback(async (code: string) => {
    setStoredUserId(code.trim());
    try {
      setSession(await api.me());
    } catch {
      setStoredUserId(null);
      setSession(null);
      throw new Error("복구 코드를 찾을 수 없어요");
    }
  }, []);

  const logout = useCallback(() => {
    setStoredUserId(null);
    setSession(null);
  }, []);

  const value = useMemo<SessionState>(
    () => ({ loading, session, config, login, loginWithCode, logout, refresh }),
    [loading, session, config, login, loginWithCode, logout, refresh],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
