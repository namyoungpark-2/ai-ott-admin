"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useParams } from "next/navigation";
import * as React from "react";

import { DataTable } from "@/components/table/DataTable";
import { KeyValue } from "@/components/kv/KeyValue";
import { ExpandableText } from "@/components/table/ExpandableText";
import { actionsColumn, selectColumn } from "@/components/table/columns";
import { Tabs } from "@/components/tabs/Tab";
import { useToast } from "@/components/toast";
import { Badge, Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/http";
import type { AdminCategoryResult, AdminUpdateMetadataCommand, AdminUpdateTaxonomyCommand } from "@/lib/types";

type ContentDetail = {
  contentId: string;
  title?: string;
  uiStatus?: string;
  contentStatus?: string;
  hlsPath?: string;
  thumbnailPath?: string;
  videoAssets?: Array<{
    assetId: string;
    status?: string;
    errorMessage?: string;
    updatedAt?: string;
    attemptCount?: number;
  }>;
  jobs?: Array<{
    jobId: string;
    type?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    errorMessage?: string;
  }>;
  recentEvents?: Array<{
    id: string;
    type: string;
    positionMs?: number;
    createdAt?: string;
    userId?: string;
  }>;
  updatedAt?: string;
  createdAt?: string;
};

const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "UNLISTED", "ARCHIVED"];

function statusTone(s?: string) {
  const v = (s ?? "").toUpperCase();
  if (v.includes("FAIL")) return "danger";
  if (v.includes("READY") || v.includes("SUCCESS") || v.includes("DONE")) return "success";
  if (v.includes("PROCESS") || v.includes("RUN") || v.includes("PEND")) return "warning";
  return "neutral";
}

export default function AdminContentDetailPage() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const contentId = params?.id;

  const [tab, setTab] = React.useState<"overview" | "assets" | "jobs" | "events" | "edit">("overview");
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<ContentDetail | null>(null);
  const [polling, setPolling] = React.useState(true);
  const [pollMs, setPollMs] = React.useState(4000);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<number | null>(null);

  // Edit tab state
  const [categories, setCategories] = React.useState<AdminCategoryResult[]>([]);
  const [metaLang, setMetaLang] = React.useState("en");
  const [metaTitle, setMetaTitle] = React.useState("");
  const [metaDesc, setMetaDesc] = React.useState("");
  const [metaRuntime, setMetaRuntime] = React.useState("");
  const [metaReleaseAt, setMetaReleaseAt] = React.useState("");
  const [metaPosterUrl, setMetaPosterUrl] = React.useState("");
  const [metaBannerUrl, setMetaBannerUrl] = React.useState("");
  const [metaAgeRating, setMetaAgeRating] = React.useState("");
  const [metaFeatured, setMetaFeatured] = React.useState(false);
  const [metaStatus, setMetaStatus] = React.useState("DRAFT");
  const [taxoCategorySlugs, setTaxoCategorySlugs] = React.useState<string[]>([]);
  const [taxoTags, setTaxoTags] = React.useState("");
  const [changeStatus, setChangeStatus] = React.useState("DRAFT");
  const [savingMeta, setSavingMeta] = React.useState(false);
  const [savingTaxo, setSavingTaxo] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState(false);

  async function fetchDetail({ silent = false }: { silent?: boolean } = {}) {
    if (!contentId) return;
    if (!silent) { setLoading(true); setErr(null); }
    try {
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

  React.useEffect(() => { fetchDetail(); }, [contentId]);

  React.useEffect(() => {
    if (!polling) return;
    const id = window.setInterval(() => fetchDetail({ silent: true }), pollMs);
    return () => window.clearInterval(id);
  }, [polling, pollMs, contentId]);

  // Load categories when edit tab is first opened
  React.useEffect(() => {
    if (tab === "edit" && categories.length === 0) {
      apiGet<AdminCategoryResult[]>("/api/admin/categories")
        .then(setCategories)
        .catch(() => {});
    }
  }, [tab]);

  // Pre-fill edit form when detail loads
  React.useEffect(() => {
    if (detail) {
      setMetaTitle(String(detail.title ?? ""));
      setChangeStatus(String(detail.contentStatus ?? "DRAFT").toUpperCase());
      setMetaStatus(String(detail.contentStatus ?? "DRAFT").toUpperCase());
    }
  }, [detail?.contentId]);

  async function onTranscode() {
    if (!contentId) return;
    try {
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
      await apiPost(`/api/admin/contents/${contentId}/retry`, {});
      toast({ type: "success", title: "Retry requested", description: contentId });
      fetchDetail({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Retry failed", description: e?.message ?? "Unknown" });
    }
  }

  async function onSaveMetadata(e: React.FormEvent) {
    e.preventDefault();
    if (!contentId) return;
    setSavingMeta(true);
    try {
      const cmd: AdminUpdateMetadataCommand = {
        lang: metaLang,
        title: metaTitle,
        description: metaDesc || undefined,
        runtimeSeconds: metaRuntime ? Number(metaRuntime) : undefined,
        releaseAt: metaReleaseAt || undefined,
        posterUrl: metaPosterUrl || undefined,
        bannerUrl: metaBannerUrl || undefined,
        ageRating: metaAgeRating || undefined,
        featured: metaFeatured,
        status: metaStatus || undefined,
      };
      await apiPut(`/api/admin/contents/${contentId}/metadata`, cmd);
      toast({ type: "success", title: "Metadata saved" });
      fetchDetail({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Failed to save metadata", description: e?.message });
    } finally {
      setSavingMeta(false);
    }
  }

  async function onSaveTaxonomy(e: React.FormEvent) {
    e.preventDefault();
    if (!contentId) return;
    setSavingTaxo(true);
    try {
      const cmd: AdminUpdateTaxonomyCommand = {
        categorySlugs: taxoCategorySlugs,
        tags: taxoTags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      await apiPut(`/api/admin/contents/${contentId}/taxonomy`, cmd);
      toast({ type: "success", title: "Taxonomy saved" });
    } catch (e: any) {
      toast({ type: "error", title: "Failed to save taxonomy", description: e?.message });
    } finally {
      setSavingTaxo(false);
    }
  }

  async function onChangeStatus() {
    if (!contentId) return;
    setSavingStatus(true);
    try {
      await apiPatch(`/api/admin/contents/${contentId}/status`, { status: changeStatus });
      toast({ type: "success", title: `Status changed to ${changeStatus}` });
      fetchDetail({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Failed to change status", description: e?.message });
    } finally {
      setSavingStatus(false);
    }
  }

  function toggleCategorySlug(slug: string) {
    setTaxoCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  type AssetRow = NonNullable<ContentDetail["videoAssets"]>[number];
  const assetCols = React.useMemo<ColumnDef<AssetRow>[]>(() => [
    selectColumn<AssetRow>(),
    { accessorKey: "assetId", header: "Asset ID", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => { const s = String(getValue() ?? "-"); return <Badge tone={statusTone(s) as any}>{s}</Badge>; } },
    { accessorKey: "attemptCount", header: "Attempts", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? 0)}</span> },
    { accessorKey: "errorMessage", header: "Error", cell: ({ getValue }) => <ExpandableText text={String(getValue() ?? "")} /> },
    { accessorKey: "updatedAt", header: "Updated", cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))]">{String(getValue() ?? "-")}</span> },
    actionsColumn<AssetRow>(),
  ], []);

  type JobRow = NonNullable<ContentDetail["jobs"]>[number];
  const jobCols = React.useMemo<ColumnDef<JobRow>[]>(() => [
    selectColumn<JobRow>(),
    { accessorKey: "jobId", header: "Job ID", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span> },
    { accessorKey: "type", header: "Type", cell: ({ getValue }) => <span className="text-[rgb(var(--fg))]">{String(getValue() ?? "-")}</span> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => { const s = String(getValue() ?? "-"); return <Badge tone={statusTone(s) as any}>{s}</Badge>; } },
    { accessorKey: "createdAt", header: "Created", cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))]">{String(getValue() ?? "-")}</span> },
    { accessorKey: "updatedAt", header: "Updated", cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))]">{String(getValue() ?? "-")}</span> },
    { accessorKey: "errorMessage", header: "Error", cell: ({ getValue }) => <ExpandableText text={String(getValue() ?? "")} /> },
    actionsColumn<JobRow>(),
  ], []);

  if (loading) return <div className="text-sm text-[rgb(var(--fg-secondary))]">Loading…</div>;

  if (err) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="font-semibold text-red-400">Failed to load</div>
        <div className="mt-1 text-sm text-red-400">{err}</div>
        <div className="mt-4 flex items-center gap-2">
          <Button tone="secondary" onClick={() => fetchDetail()}>Retry</Button>
          <Button tone="secondary" onClick={() => setPolling((v) => !v)}>
            Polling: {polling ? "ON" : "OFF"}
          </Button>
        </div>
      </div>
    );
  }

  if (!detail) return <div className="text-sm text-[rgb(var(--fg-secondary))]">No data</div>;

  const statusA = String(detail.uiStatus ?? detail.contentStatus ?? "UNKNOWN");
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
    { key: "edit", label: "Edit" },
  ] as const;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-xl font-extrabold tracking-tight">{String(detail.title ?? "Untitled")}</div>
                <Badge tone={statusTone(statusA) as any}>{statusA}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--fg-secondary))]">
                <span className="font-mono text-xs">{detail.contentId}</span>
                {detail.updatedAt ? <span>• updated: {String(detail.updatedAt)}</span> : null}
                {lastUpdatedAt ? (
                  <span className="text-xs text-[rgb(var(--fg-secondary))]">• refreshed: {new Date(lastUpdatedAt).toLocaleTimeString()}</span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button tone="primary" className="h-10" onClick={onTranscode}>Transcode</Button>
              <Button tone="danger" className="h-10" onClick={onRetry}>Retry</Button>
              <Button tone="secondary" className="h-10" onClick={() => window.open(`/watch/${detail.contentId}`, "_blank")}>Open watch</Button>
              <Button tone="secondary" className="h-10" onClick={() => fetchDetail()}>Refresh</Button>
              <Button tone="secondary" className="h-10" onClick={() => setPolling((v) => !v)}>
                Polling: {polling ? "ON" : "OFF"}
              </Button>
              <select
                className="h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 text-sm"
                value={pollMs}
                onChange={(e) => setPollMs(Number(e.target.value))}
              >
                {[3000, 4000, 5000, 8000, 12000].map((n) => (
                  <option key={n} value={n}>{n / 1000}s</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Assets</div>
              <div className="mt-1 text-2xl font-extrabold">{assets.length}</div>
              <div className="mt-1 text-xs text-[rgb(var(--fg-secondary))]">Total video assets</div>
            </div>
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 shadow-sm">
              <div className="text-xs font-semibold text-red-400">Failed</div>
              <div className="mt-1 text-2xl font-extrabold text-red-400">{failedAssets}</div>
              <div className="mt-1 text-xs text-red-400">Needs retry/transcode</div>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm">
              <div className="text-xs font-semibold text-amber-400">Processing</div>
              <div className="mt-1 text-2xl font-extrabold text-amber-400">{processingAssets}</div>
              <div className="mt-1 text-xs text-amber-400">In progress</div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--brand))]/40 bg-violet-500/10 p-4 shadow-sm">
              <div className="text-xs font-semibold text-violet-400">Jobs</div>
              <div className="mt-1 text-2xl font-extrabold text-violet-400">{jobs.length}</div>
              <div className="mt-1 text-xs text-violet-400">Recent job records</div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs items={tabs as any} value={tab} onChange={(k) => setTab(k as any)} />
        </CardContent>
      </Card>

      {tab === "overview" ? (
        <div className="space-y-4">
          <KeyValue
            cols={3}
            items={[
              { k: "Content ID", v: <span className="font-mono text-xs">{detail.contentId}</span> },
              { k: "Title", v: String(detail.title ?? "-") },
              { k: "Status", v: <Badge tone={statusTone(statusA) as any}>{statusA}</Badge> },
              { k: "HLS", v: detail.hlsPath ? <span className="font-mono text-xs">{String(detail.hlsPath)}</span> : "-" },
              { k: "Thumbnail", v: detail.thumbnailPath ? <span className="font-mono text-xs">{String(detail.thumbnailPath)}</span> : "-" },
              { k: "Updated", v: String(detail.updatedAt ?? "-") },
            ]}
          />
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Quick links</div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              {detail.hlsPath ? (
                <Button tone="secondary" onClick={() => window.open(detail.hlsPath!, "_blank")}>Open HLS</Button>
              ) : null}
              {detail.thumbnailPath ? (
                <Button tone="secondary" onClick={() => window.open(detail.thumbnailPath!, "_blank")}>Open Thumbnail</Button>
              ) : null}
              <Button tone="secondary" onClick={() => window.open(`/watch/${detail.contentId}`, "_blank")}>Open Watch Page</Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "assets" ? (
        <DataTable<AssetRow>
          title="Video Assets"
          description="Inspect asset status and errors."
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
                  await apiPost(`/api/admin/video-assets/${r.assetId}/retry`, {});
                  toast({ type: "success", title: "Asset retry requested", description: r.assetId });
                  fetchDetail({ silent: true });
                } catch (e: any) {
                  toast({ type: "error", title: "Asset retry failed", description: e?.message });
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
            </CardHeader>
            <CardContent>
              {events.length ? (
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs font-semibold text-[rgb(var(--fg-secondary))]">
                      <tr className="border-b border-[rgb(var(--border))]">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]/60">
                          <td className="px-4 py-3"><Badge tone="brand">{e.type}</Badge></td>
                          <td className="px-4 py-3 font-mono text-xs">{String(e.positionMs ?? "-")}</td>
                          <td className="px-4 py-3 font-mono text-xs">{String(e.userId ?? "-")}</td>
                          <td className="px-4 py-3 text-[rgb(var(--fg-secondary))]">{String(e.createdAt ?? "-")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-[rgb(var(--fg-secondary))]">No events yet.</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div className="text-sm font-semibold">Debug helpers</div></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button tone="secondary" onClick={() => window.open(`/api/app/contents/${detail.contentId}`, "_blank")}>Open app content API</Button>
              <Button tone="secondary" onClick={() => window.open(`/api/app/watch-events?contentId=${detail.contentId}`, "_blank")}>Query watch-events</Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "edit" ? (
        <div className="space-y-4">
          {/* Status change */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Change Status</div>
              <div className="text-xs text-[rgb(var(--fg-secondary))]">Current: <Badge tone={statusTone(statusA) as any}>{statusA}</Badge></div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <select
                  className="h-10 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                  value={changeStatus}
                  onChange={(e) => setChangeStatus(e.target.value)}
                >
                  {CONTENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button tone="primary" onClick={onChangeStatus} disabled={savingStatus}>
                  {savingStatus ? "Saving…" : "Apply Status"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metadata form */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Metadata</div>
              <div className="text-xs text-[rgb(var(--fg-secondary))]">Update title, description, and other i18n fields.</div>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSaveMetadata} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Language</label>
                    <select
                      className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                      value={metaLang}
                      onChange={(e) => setMetaLang(e.target.value)}
                    >
                      <option value="en">English (en)</option>
                      <option value="ko">Korean (ko)</option>
                      <option value="ja">Japanese (ja)</option>
                      <option value="zh">Chinese (zh)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Title *</label>
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Content title"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Description</label>
                  <textarea
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--brand))] focus:border-[rgb(var(--brand))] min-h-[80px]"
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    placeholder="Short description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Runtime (seconds)</label>
                    <Input
                      type="number"
                      value={metaRuntime}
                      onChange={(e) => setMetaRuntime(e.target.value)}
                      placeholder="e.g. 5400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Release Date</label>
                    <Input
                      type="datetime-local"
                      value={metaReleaseAt}
                      onChange={(e) => setMetaReleaseAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Age Rating</label>
                    <Input
                      value={metaAgeRating}
                      onChange={(e) => setMetaAgeRating(e.target.value)}
                      placeholder="e.g. PG-13"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Poster URL</label>
                    <Input
                      value={metaPosterUrl}
                      onChange={(e) => setMetaPosterUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Banner URL</label>
                    <Input
                      value={metaBannerUrl}
                      onChange={(e) => setMetaBannerUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Content Status</label>
                    <select
                      className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                      value={metaStatus}
                      onChange={(e) => setMetaStatus(e.target.value)}
                    >
                      {CONTENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={metaFeatured}
                        onChange={(e) => setMetaFeatured(e.target.checked)}
                        className="h-4 w-4 rounded"
                      />
                      Featured
                    </label>
                  </div>
                </div>

                <Button type="submit" tone="primary" disabled={savingMeta || !metaTitle.trim()}>
                  {savingMeta ? "Saving…" : "Save Metadata"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Taxonomy form */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Taxonomy</div>
              <div className="text-xs text-[rgb(var(--fg-secondary))]">Assign categories and tags for catalog browsing.</div>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSaveTaxonomy} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Categories</label>
                  {categories.length === 0 ? (
                    <div className="text-xs text-[rgb(var(--fg-secondary))]">No categories found. Create some in the Categories page first.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {categories.filter((c) => c.active).map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => toggleCategorySlug(c.slug)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            taxoCategorySlugs.includes(c.slug)
                              ? "border-violet-400 bg-violet-500/20 text-violet-300"
                              : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg-secondary))] hover:bg-[rgb(var(--muted))]"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {taxoCategorySlugs.length > 0 && (
                    <div className="text-xs text-[rgb(var(--fg-secondary))]">Selected: {taxoCategorySlugs.join(", ")}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Tags (comma-separated)</label>
                  <Input
                    value={taxoTags}
                    onChange={(e) => setTaxoTags(e.target.value)}
                    placeholder="e.g. action, drama, thriller"
                  />
                </div>

                <Button type="submit" tone="primary" disabled={savingTaxo}>
                  {savingTaxo ? "Saving…" : "Save Taxonomy"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
