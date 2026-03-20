"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatCard } from "@/components/metrics/StatCard";
import { RightPanel } from "@/components/panel/RightPanel";
import { actionsColumn, selectColumn } from "@/components/table/columns";
import { DataTable } from "@/components/table/DataTable";
import { ExpandableText } from "@/components/table/ExpandableText";
import { Badge, Button, Input } from "@/components/ui";
import { apiGet, apiPost } from "@/lib/http";
import { useToast } from "@/components/toast";

/** ✅ 너희 응답에 맞춰 필드명만 조정 */
type FailureRow = {
  contentId: string;
  assetId?: string;
  title?: string;

  uiStatus?: string;
  assetStatus?: string;
  latestJobStatus?: string;
  errorMessage?: string;

  attemptCount?: number;
  updatedAt?: string;
};

function statusTone(s?: string) {
  const v = (s ?? "").toUpperCase();
  if (v.includes("FAIL")) return "danger";
  if (v.includes("READY") || v.includes("SUCCESS") || v.includes("DONE")) return "success";
  if (v.includes("PROCESS") || v.includes("RUN") || v.includes("PEND")) return "warning";
  return "neutral";
}

function bestStatus(r: FailureRow) {
  return r.uiStatus ?? r.assetStatus ?? r.latestJobStatus ?? "UNKNOWN";
}

function classify(r: FailureRow) {
  const v = bestStatus(r).toUpperCase();
  if (v.includes("FAIL")) return "FAILED";
  if (v.includes("PROCESS") || v.includes("RUN") || v.includes("PEND")) return "PROCESSING";
  if (v.includes("READY") || v.includes("SUCCESS") || v.includes("DONE")) return "HEALTHY";
  return "OTHER";
}

export default function AdminFailuresPage() {
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<FailureRow[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  // ✅ 제품급 UX: 폴링 on/off + 인터벌
  const [polling, setPolling] = React.useState(true);
  const [pollMs, setPollMs] = React.useState(4000);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<number | null>(null);

  // ✅ Summary 카드 클릭 필터(빠른 스코프)
  const [scope, setScope] = React.useState<"ALL" | "FAILED" | "PROCESSING" | "HEALTHY">("ALL");

  // ✅ 추가 검색(카드+테이블 검색과 별개로 “페이지 스코프”를 줄일 때 유용)
  const [quickQ, setQuickQ] = React.useState("");
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<FailureRow | null>(null);

  function openPanel(r: FailureRow) {
    setSelected(r);
    setPanelOpen(true);
}


  async function refresh({ silent = false }: { silent?: boolean } = {}) {
    if (!silent) {
      setLoading(true);
      setErr(null);
    }
    try {
      /** ✅ 너희 Failures 목록 API로 맞추기 */
      const res = await apiGet<FailureRow[]>("/api/admin/failures");
      setRows(res ?? []);
      setLastUpdatedAt(Date.now());
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load failures");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
  }, []);

  // ✅ 자동 폴링
  React.useEffect(() => {
    if (!polling) return;
    const id = window.setInterval(() => {
      refresh({ silent: true });
    }, pollMs);
    return () => window.clearInterval(id);
  }, [polling, pollMs]);

  async function retryOne(r: FailureRow) {
    try {
      /** ✅ 너희 retry endpoint로 맞추기 */
      if (r.assetId) {
        await apiPost(`/api/admin/video-assets/${r.assetId}/retry`, {});
      } else {
        await apiPost(`/api/admin/contents/${r.contentId}/retry`, {});
      }
      toast({
        type: "success",
        title: "Retry requested",
        description: r.assetId ? `assetId=${r.assetId}` : `contentId=${r.contentId}`,
      });

      // ✅ 제품급: 액션 후 즉시 1회 당겨서 새 상태 반영
      refresh({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Retry failed", description: e?.message ?? "Unknown error" });
    }
  }

  async function transcodeOne(r: FailureRow) {
    try {
      /** ✅ 너희 transcode endpoint로 맞추기 */
      await apiPost(`/api/admin/contents/${r.contentId}/transcode`, {});
      toast({ type: "success", title: "Transcode started", description: r.contentId });
      refresh({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Transcode failed", description: e?.message ?? "Unknown" });
    }
  }

  // ✅ Summary 계산
  const stats = React.useMemo(() => {
    let failed = 0,
      processing = 0,
      healthy = 0,
      other = 0;
    for (const r of rows) {
      const c = classify(r);
      if (c === "FAILED") failed++;
      else if (c === "PROCESSING") processing++;
      else if (c === "HEALTHY") healthy++;
      else other++;
    }
    return {
      total: rows.length,
      failed,
      processing,
      healthy,
      other,
    };
  }, [rows]);

  // ✅ scope + quick search 를 먼저 적용한 “페이지 레벨 rows”
  const scopedRows = React.useMemo(() => {
    const q = quickQ.trim().toLowerCase();
    return rows.filter((r) => {
      if (scope !== "ALL" && classify(r) !== scope) return false;
      if (!q) return true;
      const txt = `${r.contentId ?? ""} ${r.assetId ?? ""} ${r.title ?? ""} ${bestStatus(r)} ${r.errorMessage ?? ""}`.toLowerCase();
      return txt.includes(q);
    });
  }, [rows, scope, quickQ]);

  const columns = React.useMemo<ColumnDef<FailureRow>[]>(() => {
    return [
      selectColumn<FailureRow>(),
      {
        accessorKey: "contentId",
        header: "Content",
        cell: ({ row, getValue }) => (
          <div className="flex flex-col">
            <Link
              className="font-mono text-xs text-[rgb(var(--fg))] hover:underline"
              href={`/admin/contents/${row.original.contentId}`}
            >
              {String(getValue() ?? "")}
            </Link>
            {row.original.assetId ? (
              <span className="font-mono text-[11px] text-[rgb(var(--fg-secondary))]">asset: {row.original.assetId}</span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ getValue }) => (
          <div className="max-w-[420px] truncate text-[rgb(var(--fg))]">{String(getValue() ?? "-")}</div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = bestStatus(row.original);
          return <Badge tone={statusTone(s) as any}>{s}</Badge>;
        },
      },
      {
        accessorKey: "attemptCount",
        header: "Attempts",
        cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? 0)}</span>,
      },
      {
        accessorKey: "errorMessage",
        header: "Error",
        cell: ({ getValue }) => <ExpandableText text={String(getValue() ?? "")} />,
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))]">{String(getValue() ?? "-")}</span>,
      },
      actionsColumn<FailureRow>(),
    ];
  }, []);

  if (loading) return <div className="text-sm text-[rgb(var(--fg-secondary))]">Loading…</div>;

  if (err) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="font-semibold text-red-400">Failed to load</div>
        <div className="mt-1 text-sm text-red-400">{err}</div>
        <div className="mt-4 flex items-center gap-2">
          <Button tone="secondary" onClick={() => refresh()}>
            Retry
          </Button>
          <Button tone="secondary" onClick={() => setPolling((v) => !v)}>
            Polling: {polling ? "ON" : "OFF"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ Summary + Controls */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <div className="text-lg font-bold tracking-tight">Failures</div>
            <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">
              Monitor failed assets, trigger retries, and watch status converge.
            </div>
            <div className="mt-2 text-xs text-[rgb(var(--fg-secondary))]">
              {lastUpdatedAt
                ? `Last updated: ${new Date(lastUpdatedAt).toLocaleTimeString()}`
                : "Last updated: -"}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <Input
              value={quickQ}
              onChange={(e) => setQuickQ(e.target.value)}
              placeholder="Quick filter (contentId/assetId/title/error)…"
            />

            <Button tone="secondary" className="h-10" onClick={() => refresh()}>
              Refresh
            </Button>

            <Button tone="secondary" className="h-10" onClick={() => setPolling((v) => !v)}>
              Polling: {polling ? "ON" : "OFF"}
            </Button>

            <select
              className="h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 text-sm"
              value={pollMs}
              onChange={(e) => setPollMs(Number(e.target.value))}
              title="Polling interval"
            >
              {[3000, 4000, 5000, 8000, 12000].map((n) => (
                <option key={n} value={n}>
                  {n / 1000}s
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Failed"
            value={stats.failed}
            tone="danger"
            active={scope === "FAILED"}
            hint="Needs action"
            onClick={() => setScope((s) => (s === "FAILED" ? "ALL" : "FAILED"))}
          />
          <StatCard
            label="Processing"
            value={stats.processing}
            tone="warning"
            active={scope === "PROCESSING"}
            hint="In progress"
            onClick={() => setScope((s) => (s === "PROCESSING" ? "ALL" : "PROCESSING"))}
          />
          <StatCard
            label="Healthy"
            value={stats.healthy}
            tone="success"
            active={scope === "HEALTHY"}
            hint="No action needed"
            onClick={() => setScope((s) => (s === "HEALTHY" ? "ALL" : "HEALTHY"))}
          />
          <StatCard
            label="Total"
            value={stats.total}
            tone="neutral"
            active={scope === "ALL"}
            hint={stats.other ? `Other: ${stats.other}` : undefined}
            onClick={() => setScope("ALL")}
          />
        </div>
      </div>

      {/* ✅ DataTable */}
      <DataTable<FailureRow>
        title="Failed video assets"
        description="Row actions provide quick operations. Use bulk retry for batch recovery."
        data={scopedRows}
        columns={columns}
        searchPlaceholder="Search inside table… (refines scoped results)"
        globalSearchText={(r) =>
          `${r.contentId ?? ""} ${r.assetId ?? ""} ${r.title ?? ""} ${bestStatus(r)} ${r.errorMessage ?? ""}`
        }
        rowActions={[
          { label: "Open panel", onClick: (r) => openPanel(r) },
          { label: "Retry", tone: "danger", onClick: retryOne },
          { label: "Transcode", onClick: transcodeOne },
          {
            label: "Open detail",
            onClick: (r) => {
              window.location.href = `/admin/contents/${r.contentId}`;
            },
          },
          {
            label: "Open watch",
            onClick: (r) => {
              window.open(`/watch/${r.contentId}`, "_blank");
            },
          },
        ]}
        bulkActions={[
          {
            label: "Bulk Retry",
            tone: "danger",
            onClick: async (selected) => {
              // 서버 bulk API가 없으면 순차 호출.
              // 제품화 단계에서는 서버쪽 Bulk Retry endpoint 만들면 훨씬 깔끔해짐.
              for (const r of selected) await retryOne(r);
            },
          },
        ]}
        initialPageSize={20}
        initialDensity="compact"
      />
      <RightPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={selected?.title ?? "Failure"}
        subtitle={selected ? `contentId=${selected.contentId} ${selected.assetId ? `• assetId=${selected.assetId}` : ""}` : undefined}
        actions={
          selected ? (
            <>
              <Button tone="danger" className="h-9" onClick={() => retryOne(selected)}>Retry</Button>
              <Button tone="secondary" className="h-9" onClick={() => transcodeOne(selected)}>Transcode</Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Status</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(bestStatus(selected)) as any}>{bestStatus(selected)}</Badge>
                {selected.latestJobStatus ? (
                  <Badge tone={statusTone(selected.latestJobStatus) as any}>{selected.latestJobStatus}</Badge>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Error</div>
              <div className="mt-2">
                <ExpandableText text={selected.errorMessage ?? ""} clamp={4} />
              </div>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Ops</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button tone="secondary" onClick={() => window.open(`/watch/${selected.contentId}`, "_blank")}>
                  Open watch
                </Button>
                <Button tone="secondary" onClick={() => (window.location.href = `/admin/contents/${selected.contentId}`)}>
                  Open content detail
                </Button>
                <Button
                  tone="secondary"
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(selected.contentId); } catch {}
                  }}
                >
                  Copy contentId
                </Button>
                {selected.assetId ? (
                  <Button
                    tone="secondary"
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(selected.assetId!); } catch {}
                    }}
                  >
                    Copy assetId
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </RightPanel>
    </div>
  );
}
