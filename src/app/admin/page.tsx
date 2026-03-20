"use client";

import * as React from "react";
import Link from "next/link";
import { apiGet } from "@/lib/http";
import { StatCard } from "@/components/metrics/StatCard";
import { Card, CardContent, CardHeader, Skeleton } from "@/components/ui";

type FailureRow = {
  uiStatus?: string;
  assetStatus?: string;
  latestJobStatus?: string;
};

function classify(r: FailureRow) {
  const v = (r.uiStatus ?? r.assetStatus ?? r.latestJobStatus ?? "").toUpperCase();
  if (v.includes("FAIL")) return "FAILED";
  if (v.includes("PROCESS") || v.includes("RUN") || v.includes("PEND")) return "PROCESSING";
  if (v.includes("READY") || v.includes("SUCCESS") || v.includes("DONE")) return "HEALTHY";
  return "OTHER";
}

export default function AdminDashboardPage() {
  const [rows, setRows] = React.useState<FailureRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiGet<FailureRow[]>("/api/admin/failures")
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = React.useMemo(() => {
    let failed = 0, processing = 0, healthy = 0;
    for (const r of rows) {
      const c = classify(r);
      if (c === "FAILED") failed++;
      else if (c === "PROCESSING") processing++;
      else if (c === "HEALTHY") healthy++;
    }
    return { total: rows.length, failed, processing, healthy };
  }, [rows]);

  const shortcuts = [
    { href: "/admin/contents", label: "Contents", desc: "Browse and manage all content" },
    { href: "/admin/contents/new", label: "New Content", desc: "Create a content record" },
    { href: "/admin/upload", label: "Upload Video", desc: "Upload a video file" },
    { href: "/admin/categories", label: "Categories", desc: "Manage content categories" },
    { href: "/admin/failures", label: "Failures", desc: "Monitor failed transcodes" },
    { href: "/admin/ops", label: "Ops", desc: "Transcoding pipeline metrics" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold tracking-tight">Dashboard</div>
        <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">AI OTT admin overview.</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <StatCard label="Total" value={stats.total} tone="neutral" hint="All content" />
            <StatCard label="Failed" value={stats.failed} tone="danger" hint="Needs action" />
            <StatCard label="Processing" value={stats.processing} tone="warning" hint="In progress" />
            <StatCard label="Healthy" value={stats.healthy} tone="success" hint="Ready" />
          </>
        )}
      </div>

      {/* Quick nav */}
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Quick navigation</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4 hover:bg-[rgb(var(--muted))] transition-colors"
              >
                <div className="text-sm font-semibold text-[rgb(var(--fg))]">{s.label}</div>
                <div className="mt-1 text-xs text-[rgb(var(--fg-secondary))]">{s.desc}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
