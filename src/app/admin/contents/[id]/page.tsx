"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useParams } from "next/navigation";
import * as React from "react";

import { KeyValue } from "@/components/kv/KeyValue";
import { ExpandableText } from "@/components/table/ExpandableText";
import { actionsColumn, selectColumn } from "@/components/table/columns";
import { Tabs } from "@/components/tabs/Tab";
import { useToast } from "@/components/toast";
import { Badge, Button, Card, CardContent, CardHeader } from "@/components/ui";
import { apiGet, apiPost } from "@/lib/http";

/**
 * ✅ 너희 detail 응답에 맞춰 필요한 필드만 맞추면 됨.
 * "조정 포인트"는 아래 fetchDetail()에 표시.
 */
type ContentDetail = {
  contentId: string;
  title?: string;

  uiStatus?: string;
  contentStatus?: string;

  // asset / hls
  hlsPath?: string;
  thumbnailPath?: string;

  // video assets 상태(있다면)
  videoAssets?: Array<{
    assetId: string;
    status?: string;
    errorMessage?: string;
    updatedAt?: string;
    attemptCount?: number;
  }>;

  // jobs(있으면)
  jobs?: Array<{
    jobId: string;
    type?: string; // TRANSCODE/RETRY etc
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    errorMessage?: string;
  }>;

  // watch events(있으면)
  recentEvents?: Array<{
    id: string;
    type: string; // PLAY/HEARTBEAT/COMPLETE
    positionMs?: number;
    createdAt?: string;
    userId?: string;
  }>;

  updatedAt?: string;
  createdAt?: string;
};

function statusTone(s?: string) {
  const v = (s ?? "").toUpperCase();
  if (v.includes("FAIL")) return "danger";
  if (v.includes("READY") || v.includes("SUCCESS") || v.includes("DONE")) return "success";
  if (v.includes("PROCESS") || v.includes("RUN") || v.includes("PEND")) return "warning";
  return "neutral";
}

export default function AdminContentDetailPage() {
  const { toast } = useToast();
  const params = useParams<{ contentId: string }>();
  const contentId = params?.contentId;

  const [tab, setTab] = React.useState<"overview" | "assets" | "jobs" | "events">("overview");
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<ContentDetail | null>(null);

  // ✅ 제품급 UX: 폴링 + 토글 + 마지막 업데이트
  const [polling, setPolling] = React.useState(true);
  const [pollMs, setPollMs] = React.useState(4000);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<number | null>(null);

  async function fetchDetail({ silent = false }: { silent?: boolean } = {}) {
    if (!contentId) return;
    if (!silent) {
      setLoading(true);
      setErr(null);
    }
    try {
      /**
       * ✅ 조정 포인트 1: 상세 API
       * 너희 기존 상세 API 경로로 변경
       * 예) /api/admin/contents/{id}
       */
      const res = await apiGet<ContentDetail>(`/api/admin/contents/${contentId}`);
      setDetail(res);
      setLastUpdatedAt(Date.now());
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load detail");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchDetail();
  }, [contentId]);

  React.useEffect(() => {
    if (!polling) return;
    const id = window.setInterval(() => {
      fetchDetail({ silent: true });
    }, pollMs);
    return () => window.clearInterval(id);
  }, [polling, pollMs, contentId]);

  async function onTranscode() {
    if (!contentId) return;
    try {
      /**
       * ✅ 조정 포인트 2: transcode endpoint
       */
      await apiPost(`/api/admin/contents/${contentId}/transcode`, {});
      toast({ type: "success", title: "Transcode started", description: contentId });
      fetchDetail({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Transcode failed", description: e?.message ?? "Unknown" });
    }
  }

  async function onRetry() {
    if (!contentId) return;
    try {
      /**
       * ✅ 조정 포인트 3: retry endpoint
       */
      await apiPost(`/api/admin/contents/${contentId}/retry`, {});
      toast({ type: "success", title: "Retry requested", description: contentId });
      fetchDetail({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Retry failed", description: e?.message ?? "Unknown" });
    }
  }

  if (loading) return <div className="text-sm text-zinc-500">Loading…</div>;

  if (err) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="font-semibold text-red-900">Failed to load</div>
        <div className="mt-1 text-sm text-red-800">{err}</div>
        <div className="mt-4 flex items-center gap-2">
          <Button tone="secondary" onClick={() => fetchDetail()}>
            Retry
          </Button>
          <Button tone="secondary" onClick={() => setPolling((v) => !v)}>
            Polling: {polling ? "ON" : "OFF"}
          </Button>
        </div>
      </div>
    );
  }

  if (!detail) return <div className="text-sm text-zinc-500">No data</div>;

  const statusA = detail.uiStatus ?? detail.contentStatus ?? "UNKNOWN";
  const assets = detail.videoAssets ?? [];
  const jobs = detail.jobs ?? [];
  const events = detail.recentEvents ?? [];

  const failedAssets = assets.filter((a) => (a.status ?? "").toUpperCase().includes("FAIL")).length;
  const processingAssets = assets.filter((a) => (a.status ?? "").toUpperCase().includes("PROCESS")).length;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "assets", label: "Assets", badge: assets.length },
    { key: "jobs", label: "Jobs", badge: jobs.length },
    { key: "events", label: "Events", badge: events.length },
  ] as const;

  // ---------- Tables ----------
  type AssetRow = NonNullable<ContentDetail["videoAssets"]>[number];
  const assetCols = React.useMemo<ColumnDef<AssetRow>[]>(() => {
    return [
      selectColumn<AssetRow>(),
      { accessorKey: "assetId", header: "Asset ID", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span> },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = String(getValue() ?? "-");
          return <Badge tone={statusTone(s) as any}>{s}</Badge>;
        },
      },
      { accessorKey: "attemptCount", header: "Attempts", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? 0)}</span> },
      { accessorKey: "errorMessage", header: "Error", cell: ({ getValue }) => <ExpandableText text={String(getValue() ?? "")} /> },
      { accessorKey: "updatedAt", header: "Updated", cell: ({ getValue }) => <span className="text-zinc-600">{String(getValue() ?? "-")}</span> },
      actionsColumn<AssetRow>(),
    ];
  }, []);

  type JobRow = NonNullable<ContentDetail["jobs"]>[number];
  const jobCols = React.useMemo<ColumnDef<JobRow>[]>(() => {
    return [
      selectColumn<JobRow>(),
      { accessorKey: "jobId", header: "Job ID", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span> },
      { accessorKey: "type", header: "Type", cell: ({ getValue }) => <span className="text-zinc-900">{String(getValue() ?? "-")}</span> },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = String(getValue() ?? "-");
          return <Badge tone={statusTone(s) as any}>{s}</Badge>;
        },
      },
      { accessorKey: "createdAt", header: "Created", cell: ({ getValue }) => <span className="text-zinc-600">{String(getValue() ?? "-")}</span> },
      { accessorKey: "updatedAt", header: "Updated", cell: ({ getValue }) => <span className="text-zinc-600">{String(getValue() ?? "-")}</span> },
      { accessorKey: "errorMessage", header: "Error", cell: ({ getValue }) => <ExpandableText text={String(getValue() ?? "")} /> },
      actionsColumn<JobRow>(),
    ];
  }, []);

  type EventRow = NonNullable<ContentDetail["recentEvents"]>[number];
  const eventCols = React.useMemo<ColumnDef<EventRow>[]>(() => {
    return [
      { accessorKey: "type", header: "Type", cell: ({ getValue }) => <Badge tone="brand">{String(getValue() ?? "-")}</Badge> },
      { accessorKey: "positionMs", header: "Position", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "-")}</span> },
      { accessorKey: "userId", header: "User", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "-")}</span> },
      { accessorKey: "createdAt", header: "Created", cell: ({ getValue }) => <span className="text-zinc-600">{String(getValue() ?? "-")}</span> },
    ];
  }, []);

  // ---------- Header / Action Bar ----------
  return (
    <div className="space-y-4">
      {/* Top summary */}
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-xl font-extrabold tracking-tight">
                  {detail.title ?? "Untitled"}
                </div>
                <Badge tone={statusTone(statusA) as any}>{statusA}</Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                <span className="font-mono text-xs">{detail.contentId}</span>
                {detail.updatedAt ? <span>• updated: {detail.updatedAt}</span> : null}
                {lastUpdatedAt ? (
                  <span className="text-xs text-zinc-500">
                    • refreshed: {new Date(lastUpdatedAt).toLocaleTimeString()}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button tone="primary" className="h-10" onClick={onTranscode}>
                Transcode
              </Button>
              <Button tone="danger" className="h-10" onClick={onRetry}>
                Retry
              </Button>
              <Button
                tone="secondary"
                className="h-10"
                onClick={() => window.open(`/watch/${detail.contentId}`, "_blank")}
              >
                Open watch
              </Button>

              <Button tone="secondary" className="h-10" onClick={() => fetchDetail()}>
                Refresh
              </Button>

              <Button tone="secondary" className="h-10" onClick={() => setPolling((v) => !v)}>
                Polling: {polling ? "ON" : "OFF"}
              </Button>

              <select
                className="h-10 rounded-xl border border-zinc-200 bg-white px-2 text-sm"
                value={pollMs}
                onChange={(e) => setPollMs(Number(e.target.value))}
              >
                {[3000, 4000, 5000, 8000, 12000].map((n) => (
                  <option key={n} value={n}>
                    {n / 1000}s
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-zinc-500">Assets</div>
              <div className="mt-1 text-2xl font-extrabold">{assets.length}</div>
              <div className="mt-1 text-xs text-zinc-500">Total video assets</div>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="text-xs font-semibold text-red-700">Failed</div>
              <div className="mt-1 text-2xl font-extrabold text-red-900">{failedAssets}</div>
              <div className="mt-1 text-xs text-red-700">Needs retry/transcode</div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="text-xs font-semibold text-amber-700">Processing</div>
              <div className="mt-1 text-2xl font-extrabold text-amber-900">{processingAssets}</div>
              <div className="mt-1 text-xs text-amber-700">In progress</div>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
              <div className="text-xs font-semibold text-violet-700">Jobs</div>
              <div className="mt-1 text-2xl font-extrabold text-violet-900">{jobs.length}</div>
              <div className="mt-1 text-xs text-violet-700">Recent job records</div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Tabs */}
          <div className="flex flex-col gap-3">
            <Tabs
              items={tabs as any}
              value={tab}
              onChange={(k) => setTab(k as any)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab contents */}
      {tab === "overview" ? (
        <div className="space-y-4">
          <KeyValue
            cols={3}
            items={[
              { k: "Content ID", v: <span className="font-mono text-xs">{detail.contentId}</span> },
              { k: "Title", v: detail.title },
              { k: "Status", v: <Badge tone={statusTone(statusA) as any}>{statusA}</Badge> },
              { k: "HLS", v: detail.hlsPath ? <span className="font-mono text-xs">{detail.hlsPath}</span> : "-" },
              { k: "Thumbnail", v: detail.thumbnailPath ? <span className="font-mono text-xs">{detail.thumbnailPath}</span> : "-" },
              { k: "Updated", v: detail.updatedAt ?? "-" },
            ]}
          />

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Quick links</div>
              <div className="text-sm text-zinc-500">Open public resources to verify playback.</div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              {detail.hlsPath ? (
                <Button
                  tone="secondary"
                  onClick={() => window.open(detail.hlsPath!, "_blank")}
                >
                  Open HLS
                </Button>
              ) : null}
              {detail.thumbnailPath ? (
                <Button
                  tone="secondary"
                  onClick={() => window.open(detail.thumbnailPath!, "_blank")}
                >
                  Open Thumbnail
                </Button>
              ) : null}
              <Button tone="secondary" onClick={() => window.open(`/watch/${detail.contentId}`, "_blank")}>
                Open Watch Page
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "assets" ? (
        <DataTable<AssetRow>
          title="Video Assets"
          description="Inspect asset status and errors. Use bulk actions for batch recovery."
          data={assets}
          columns={assetCols}
          searchPlaceholder="Search assetId/status/error…"
          globalSearchText={(r) => `${r.assetId} ${r.status ?? ""} ${r.errorMessage ?? ""}`}
          rowActions={[
            {
              label: "Retry asset",
              tone: "danger",
              onClick: async (r) => {
                try {
                  // ✅ 조정 포인트 4: asset retry endpoint
                  await apiPost(`/api/admin/video-assets/${r.assetId}/retry`, {});
                  toast({ type: "success", title: "Asset retry requested", description: r.assetId });
                  fetchDetail({ silent: true });
                } catch (e: any) {
                  toast({ type: "error", title: "Asset retry failed", description: e?.message ?? "Unknown" });
                }
              },
            },
            {
              label: "Copy assetId",
              onClick: async (r) => {
                try { await navigator.clipboard.writeText(r.assetId); } catch {}
                toast({ type: "info", title: "Copied", description: r.assetId });
              },
            },
          ]}
          bulkActions={[
            {
              label: "Bulk Retry",
              tone: "danger",
              onClick: async (selected) => {
                for (const r of selected) {
                  await apiPost(`/api/admin/video-assets/${r.assetId}/retry`, {});
                }
                toast({ type: "success", title: "Bulk retry requested", description: `${selected.length} assets` });
                fetchDetail({ silent: true });
              },
            },
          ]}
          initialDensity="compact"
          initialPageSize={20}
        />
      ) : null}

      {tab === "jobs" ? (
        <DataTable<JobRow>
          title="Jobs"
          description="Recent transcode/retry jobs."
          data={jobs}
          columns={jobCols}
          searchPlaceholder="Search jobId/type/status/error…"
          globalSearchText={(r) => `${r.jobId} ${r.type ?? ""} ${r.status ?? ""} ${r.errorMessage ?? ""}`}
          rowActions={[
            {
              label: "Copy jobId",
              onClick: async (r) => {
                try { await navigator.clipboard.writeText(r.jobId); } catch {}
                toast({ type: "info", title: "Copied", description: r.jobId });
              },
            },
          ]}
          initialDensity="compact"
          initialPageSize={20}
        />
      ) : null}

      {tab === "events" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Recent watch events</div>
              <div className="text-sm text-zinc-500">
                This is useful to validate ingest + player behavior.
              </div>
            </CardHeader>
            <CardContent>
              {events.length ? (
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs font-semibold text-zinc-500">
                      <tr className="border-b border-zinc-200/70">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id} className="border-b border-zinc-200/60 hover:bg-zinc-50/60">
                          <td className="px-4 py-3">
                            <Badge tone="brand">{e.type}</Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{String(e.positionMs ?? "-")}</td>
                          <td className="px-4 py-3 font-mono text-xs">{String(e.userId ?? "-")}</td>
                          <td className="px-4 py-3 text-zinc-600">{String(e.createdAt ?? "-")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-zinc-500">No events yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Debug helpers</div>
              <div className="text-sm text-zinc-500">
                Quick actions for investigation.
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button
                tone="secondary"
                onClick={() => window.open(`/api/app/contents/${detail.contentId}`, "_blank")}
              >
                Open app content API
              </Button>
              <Button
                tone="secondary"
                onClick={() => window.open(`/api/app/watch-events?contentId=${detail.contentId}`, "_blank")}
              >
                Query watch-events
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
