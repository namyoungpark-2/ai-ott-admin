"use client";

import * as React from "react";
import { apiGet, apiPost } from "@/lib/http";

type Me = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
};

type AuthCtx = {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = React.createContext<AuthCtx | null>(null);

export function useAuth() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = React.useState<Me | null>(null);
  const [loading, setLoading] = React.useState(true);
  const didInit = React.useRef(false);

  const refresh = React.useCallback(async () => {
    try {
      const res = await apiGet<Me>("/api/admin/auth/me");
      setMe(res ?? null);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const isLoginPage =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/login");

    if (isLoginPage) {
      setLoading(false);
    } else {
      refresh();
    }
  }, [refresh]);

  const logout = React.useCallback(async () => {
    try {
      await apiPost("/api/admin/auth/logout", {});
    } catch {
      // 실패해도 프론트에서 로그인으로 보냄
    } finally {
      setMe(null);
      window.location.href = "/login";
    }
  }, []);

  return (
    <Ctx.Provider value={{ me, loading, refresh, logout }}>
      {children}
    </Ctx.Provider>
  );
}
