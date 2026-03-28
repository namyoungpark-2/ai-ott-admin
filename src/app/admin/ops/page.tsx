"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, Card, CardContent, CardHeader, Skeleton } from "@/components/ui";
import { DataTable } from "@/components/table/DataTable";
import { ExpandableText } from "@/components/table/ExpandableText";
import { StatCard } from "@/components/metrics/StatCard";
import { apiGet } from "@/lib/http";
import { useTranslation } from "@/lib/i18n";
import type { OpsSummary, OpsFailureTop, OpsRecentRow } from "@/lib/types";

function statusTone(s?: string) {
  const v = (s ?? "").toUpperCase();
  if (v.includes("FAIL")) return "danger";
  if (v.includes("SUCC")) return "success";
  if (v.includes("RUN") || v.includes("QUEUE")) return "warning";
  return "neutral";
}

export default function OpsPage() {
  const { t, lang } = useTranslation();
  const [summary, setSummary] = React.useState<OpsSummary | null>(null);
  const [topFailures, setTopFailures] = React.useState<OpsFailureTop[]>([]);
  const [recent, setRecent] = React.useState<OpsRecentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [polling, setPolling] = React.useState(false);
  const [pollMs, setPollMs] = React.useState(8000);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);

  async function refresh({ silent = false }: { silent?: boolean } = {}) {
    if (!silent) setLoading(true);
    try {
      const [s, f, r] = await Promise.all([
        apiGet<OpsSummary>("/api/ops/transcoding/summary"),
        apiGet<OpsFailureTop[]>("/api/ops/transcoding/failures-top?limit=10"),
        apiGet<OpsRecentRow[]>("/api/ops/transcoding/recent?limit=20"),
      ]);
      setSummary(s);
      setTopFailures(f ?? []);
      setRecent(r ?? []);
      setLastUpdated(Date.now());
    } catch {
      // errors shown inline
    } finally {
      if (!silent) setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); }, [lang]);

  React.useEffect(() => {
    if (!polling) return;
    const id = window.setInterval(() => refresh({ silent: true }), pollMs);
    return () => window.clearInterval(id);
  }, [polling, pollMs]);

  const failureCols = React.useMemo<ColumnDef<OpsFailureTop>[]>(() => [
    {
      accessorKey: "errorMessage",
      header: t("ops.errorMessage"),
      cell: ({ getValue }) => <ExpandableText text={String(getValue() ?? "")} />,
    },
    {
      accessorKey: "count",
      header: t("ops.count"),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-bold text-red-400">{String(getValue() ?? 0)}</span>
      ),
    },
  ], [t]);

  const recentCols = React.useMemo<ColumnDef<OpsRecentRow>[]>(() => [
    {
      accessorKey: "jobId",
      header: t("ops.jobId"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span>,
    },
    {
      accessorKey: "videoAssetId",
      header: t("ops.assetId"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span>,
    },
    {
      accessorKey: "status",
      header: t("field.status"),
      cell: ({ getValue }) => {
        const s = String(getValue() ?? "-");
        return <Badge tone={statusTone(s) as any}>{s}</Badge>;
      },
    },
    {
      accessorKey: "errorMessage",
      header: t("ops.errorMessage"),
      cell: ({ getValue }) => <ExpandableText text={String(getValue() ?? "")} />,
    },
    {
      accessorKey: "createdAt",
      header: t("field.createdAt"),
      cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))] text-xs">{String(getValue() ?? "-")}</span>,
    },
    {
      accessorKey: "updatedAt",
      header: t("field.updatedAt"),
      cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))] text-xs">{String(getValue() ?? "-")}</span>,
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-extrabold tracking-tight">{t("ops.title")}</div>
          <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">
            {t("ops.desc")}
            {lastUpdated && (
              <span className="ml-2 text-xs text-[rgb(var(--fg-secondary))]">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button tone="secondary" className="h-9" onClick={() => refresh()}>{t("common.refresh")}</Button>
          <Button tone="secondary" className="h-9" onClick={() => setPolling((v) => !v)}>
            {t("detail.polling")}: {polling ? t("detail.on") : t("detail.off")}
          </Button>
          <select
            className="h-9 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 text-sm"
            value={pollMs}
            onChange={(e) => setPollMs(Number(e.target.value))}
          >
            {[5000, 8000, 12000, 30000].map((n) => (
              <option key={n} value={n}>{n / 1000}s</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label={t("ops.totalJobs")} value={summary.totalJobs} tone="neutral" />
          <StatCard label={t("ops.succeeded")} value={summary.successCount} tone="success" />
          <StatCard label={t("ops.failed")} value={summary.failedCount} tone="danger" />
          <StatCard label={t("ops.running")} value={summary.runningCount} tone="warning" />
          <Card>
            <CardContent className="pt-5">
              <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">{t("ops.avgProcessing")}</div>
              <div className="mt-1 text-2xl font-extrabold">
                {summary.avgProcessingSeconds != null
                  ? `${summary.avgProcessingSeconds.toFixed(1)}s`
                  : "-"}
              </div>
              <div className="mt-1 text-xs text-[rgb(var(--fg-secondary))]">{t("ops.avgProcessingHint")}</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-[rgb(var(--fg-secondary))]">No summary data available.</CardContent>
        </Card>
      )}

      {/* Top failure errors */}
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">{t("ops.topFailures")}</div>
        </CardHeader>
        <CardContent>
          {topFailures.length === 0 ? (
            <div className="text-sm text-[rgb(var(--fg-secondary))]">No failure data.</div>
          ) : (
            <DataTable<OpsFailureTop>
              data={topFailures}
              columns={failureCols}
              searchPlaceholder="Search errors…"
              globalSearchText={(r) => r.errorMessage ?? ""}
              initialDensity="compact"
              initialPageSize={10}
            />
          )}
        </CardContent>
      </Card>

      {/* Recent jobs */}
      <DataTable<OpsRecentRow>
        title={t("ops.recentJobs")}
        description={t("ops.recentJobsDesc")}
        data={recent}
        columns={recentCols}
        searchPlaceholder="Search by jobId/assetId/status/error…"
        globalSearchText={(r) => `${r.jobId} ${r.videoAssetId} ${r.status} ${r.errorMessage ?? ""}`}
        initialDensity="compact"
        initialPageSize={20}
      />
    </div>
  );
}
