"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cx } from "@/components/ui";
import { CommandButton } from "@/components/command/CommandButton";
import { UserMenu } from "@/components/shell/UserMenu";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/contents", label: "Contents" },
  { href: "/admin/upload", label: "Upload" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/failures", label: "Failures" },
  { href: "/admin/ops", label: "Ops" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const crumbs = useMemo(() => {
    const parts = (pathname ?? "").split("/").filter(Boolean);
    // /admin/contents/123 -> Admin > Contents > 123
    return parts.map((p) => p[0].toUpperCase() + p.slice(1));
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cx(
            "sticky top-0 h-screen border-r border-[rgb(var(--border))] bg-[rgb(var(--card))]",
            "transition-all",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="p-4 flex items-center justify-between">
            <div className={cx("font-extrabold tracking-tight", collapsed && "hidden")}>
              <span className="text-[rgb(var(--brand))]">AI</span> OTT
            </div>
            <button
              className="rounded-xl border border-[rgb(var(--border))] px-2 py-1 text-xs opacity-80 hover:opacity-100"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <nav className="px-2">
            {NAV.map((it) => {
              const active = it.exact ? pathname === it.href : pathname?.startsWith(it.href);
              return (
                <a
                  key={it.href}
                  href={it.href}
                  className={cx(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                    "hover:bg-[rgb(var(--muted))]",
                    active && "bg-[rgb(var(--muted))] font-semibold"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-[rgb(var(--brand))]" />
                  <span className={cx(collapsed && "hidden")}>{it.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="mt-auto p-4 text-xs opacity-60">
            <div className={cx(collapsed && "hidden")}>Operations Console</div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/80 backdrop-blur">
            <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center gap-3">
              <div className="text-sm opacity-70">{crumbs.join(" / ")}</div>

              <div className="ml-auto flex items-center gap-2">
                <CommandButton />
                <UserMenu />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
