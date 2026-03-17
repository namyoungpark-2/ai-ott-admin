"use client";

import * as React from "react";
import { Button, cx } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";

export function UserMenu() {
  const { me, loading, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  if (loading) return <div className="text-xs text-zinc-500">…</div>;

  // 로그인 안 된 상태면 Login 버튼
  if (!me) {
    return (
      <Button tone="primary" className="h-9" onClick={() => (window.location.href = "/login")}>
        Login
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button tone="secondary" className="h-9" onClick={() => setOpen((v) => !v)}>
        {me.name ?? me.email ?? "Admin"}
      </Button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="p-3 border-b border-zinc-200/70">
            <div className="text-sm font-semibold truncate">{me.name ?? "Admin"}</div>
            <div className="text-xs text-zinc-500 truncate">{me.email ?? "-"}</div>
            {me.role ? <div className="mt-1 text-xs text-zinc-500">Role: {me.role}</div> : null}
          </div>

          <button
            className={cx("w-full px-3 py-2 text-left text-sm hover:bg-zinc-50")}
            onClick={() => (window.location.href = "/admin/account")}
          >
            Account
          </button>

          <button
            className={cx("w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-zinc-50")}
            onClick={() => logout()}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
