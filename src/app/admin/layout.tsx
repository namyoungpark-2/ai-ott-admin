"use client";

import React from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const didRedirect = React.useRef(false);

  React.useEffect(() => {
    if (!loading && !me && !didRedirect.current) {
      didRedirect.current = true;
      const next = window.location.pathname;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [loading, me]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-[rgb(var(--fg-secondary))]">Loading…</div>
      </div>
    );
  }

  if (!me) return null;

  return <AppShell>{children}</AppShell>;
}
