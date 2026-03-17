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

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      /**
       * ✅ 조정 포인트 1: me endpoint
       * 예) /api/admin/auth/me
       */
      const res = await apiGet<Me>("/api/admin/auth/me");
      setMe(res ?? null);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = React.useCallback(async () => {
    try {
      /**
       * ✅ 조정 포인트 2: logout endpoint
       * 예) /api/admin/auth/logout
       */
      await apiPost("/api/admin/auth/logout", {});
    } catch {
      // 쿠키/세션이 서버에서만 제거될 수도 있고,
      // 실패해도 프론트 라우팅으로 로그인으로 보냄
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
