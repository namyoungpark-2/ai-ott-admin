"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cx } from "@/components/ui";
import { CommandButton } from "@/components/command/CommandButton";
import { UserMenu } from "@/components/shell/UserMenu";

/* ─── Nav Icons ─────────────────────────────────────────────────────── */
function IconDashboard() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconContents() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconCategories() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconFailures() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function IconOps() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconChevronRight() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ─── Nav config ────────────────────────────────────────────────────── */
const NAV = [
  { href: "/admin",            label: "Dashboard",  icon: <IconDashboard />,  exact: true },
  { href: "/admin/contents",   label: "Contents",   icon: <IconContents /> },
  { href: "/admin/upload",     label: "Upload",     icon: <IconUpload /> },
  { href: "/admin/categories", label: "Categories", icon: <IconCategories /> },
  { href: "/admin/users",      label: "Users",      icon: <IconUsers /> },
  { href: "/admin/failures",   label: "Failures",   icon: <IconFailures /> },
  { href: "/admin/ops",        label: "Ops",        icon: <IconOps /> },
];

/* ─── AppShell ──────────────────────────────────────────────────────── */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const crumbs = useMemo(() => {
    const parts = (pathname ?? "").split("/").filter(Boolean);
    return parts.map((p) => p[0].toUpperCase() + p.slice(1));
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="flex">
        {/* ── Sidebar ── */}
        <aside
          className={cx(
            "sticky top-0 h-screen flex flex-col",
            "border-r border-[rgb(var(--border))]",
            "bg-[rgb(var(--card))]",
            "transition-all duration-200",
            collapsed ? "w-[60px]" : "w-60"
          )}
          style={{ backgroundImage: "radial-gradient(ellipse 200px 300px at 50% 0%, rgba(139,92,246,.07) 0%, transparent 70%)" }}
        >
          {/* Logo + collapse button */}
          <div className="flex items-center justify-between p-4 h-[60px] flex-shrink-0">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span
                  className="flex-shrink-0 inline-block w-7 h-7 rounded-lg"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#ec4899)", boxShadow: "0 0 12px rgba(139,92,246,.40)" }}
                />
                <span className="font-extrabold tracking-tight text-base">
                  <span className="text-grad">AI</span>
                  <span className="text-[rgb(var(--fg))]/80"> OTT</span>
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Toggle sidebar"
              className={cx(
                "flex items-center justify-center w-7 h-7 rounded-lg",
                "border border-[rgb(var(--border))] text-[rgb(var(--fg))]/50",
                "hover:text-[rgb(var(--fg))] hover:border-violet-500/40 hover:bg-violet-500/10 transition",
                collapsed && "mx-auto"
              )}
            >
              {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
            </button>
          </div>

          {/* Divider */}
          <div className="mx-3 h-px bg-[rgb(var(--border))]" />

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {NAV.map((it) => {
              const active = it.exact ? pathname === it.href : pathname?.startsWith(it.href);
              return (
                <a
                  key={it.href}
                  href={it.href}
                  title={collapsed ? it.label : undefined}
                  className={cx(
                    "flex items-center rounded-xl text-sm transition-all",
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                    active
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                      : "text-[rgb(var(--fg))]/55 border border-transparent hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]/90"
                  )}
                >
                  <span className={cx("flex-shrink-0", active && "text-violet-400")}>
                    {it.icon}
                  </span>
                  {!collapsed && (
                    <span className={cx("font-medium", active && "font-semibold")}>
                      {it.label}
                    </span>
                  )}
                  {active && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="p-4 text-xs text-[rgb(var(--fg))]/30 flex-shrink-0">
              Operations Console
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0">
          {/* Topbar */}
          <header
            className="sticky top-0 z-20 border-b border-[rgb(var(--border))]"
            style={{ background: "rgba(9,9,11,.85)", backdropFilter: "blur(20px)" }}
          >
            <div className="mx-auto max-w-[1400px] px-5 py-3 flex items-center gap-3">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-sm">
                {crumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-[rgb(var(--fg))]/20">/</span>}
                    <span className={i === crumbs.length - 1 ? "text-[rgb(var(--fg))]/80 font-medium" : "text-[rgb(var(--fg))]/35"}>
                      {crumb}
                    </span>
                  </span>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <CommandButton />
                <UserMenu />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] px-5 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
