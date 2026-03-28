"use client";

import { useParams } from "next/navigation";
import * as React from "react";
import Hls from "hls.js";

import { KeyValue } from "@/components/kv/KeyValue";
import { Tabs } from "@/components/tabs/Tab";
import { useToast } from "@/components/toast";
import { Badge, Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/http";
import { useLanguage } from "@/components/language/LanguageProvider";
import Link from "next/link";
import type {
  AdminContentDetailDto,
  AdminCategoryResult,
  AdminGenreResult,
  AdminUpdateMetadataCommand,
  AdminUpdateTaxonomyCommand,
} from "@/lib/types";

const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "UNLISTED", "ARCHIVED"];

function statusTone(s?: string) {
  const v = (s ?? "").toUpperCase();
  if (v.includes("FAIL")) return "danger";
  if (v.includes("READY") || v.includes("SUCCESS") || v.includes("DONE") || v.includes("PUBLISHED")) return "success";
  if (v.includes("PROCESS") || v.includes("RUN") || v.includes("PEND") || v.includes("TRANSCOD") || v.includes("UPLOAD")) return "warning";
  return "neutral";
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  } catch {
    return iso;
  }
}

/* ─── HLS Video Player ─── */
function HlsPlayer({ src }: { src: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(`HLS error: ${data.type} - ${data.details}`);
        }
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      setError("HLS is not supported in this browser.");
    }
  }, [src]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      className="w-full rounded-xl bg-black"
      style={{ maxHeight: 480 }}
    />
  );
}

/* ─── Main Page ─── */
export default function AdminContentDetailPage() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const contentId = params?.id;
  const { lang: globalLang } = useLanguage();

  const [tab, setTab] = React.useState<"overview" | "preview" | "edit">("overview");
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<AdminContentDetailDto | null>(null);
  const [polling, setPolling] = React.useState(true);
  const [pollMs, setPollMs] = React.useState(4000);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState<number | null>(null);

  // Edit tab state
  const [categories, setCategories] = React.useState<AdminCategoryResult[]>([]);
  const [metaLang, setMetaLang] = React.useState<string>(globalLang);
  const [metaTitle, setMetaTitle] = React.useState("");
  const [metaDesc, setMetaDesc] = React.useState("");
  const [metaRuntime, setMetaRuntime] = React.useState("");
  const [metaReleaseAt, setMetaReleaseAt] = React.useState("");
  const [metaPosterUrl, setMetaPosterUrl] = React.useState("");
  const [metaBannerUrl, setMetaBannerUrl] = React.useState("");
  const [metaAgeRating, setMetaAgeRating] = React.useState("");
  const [metaFeatured, setMetaFeatured] = React.useState(false);
  const [metaStatus, setMetaStatus] = React.useState("DRAFT");
  const [genres, setGenres] = React.useState<AdminGenreResult[]>([]);
  const [taxoCategorySlugs, setTaxoCategorySlugs] = React.useState<string[]>([]);
  const [taxoGenreSlugs, setTaxoGenreSlugs] = React.useState<string[]>([]);
  const [taxoTags, setTaxoTags] = React.useState("");
  const [changeStatus, setChangeStatus] = React.useState("DRAFT");
  const [savingMeta, setSavingMeta] = React.useState(false);
  const [savingTaxo, setSavingTaxo] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState(false);

  const fetchDetail = React.useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!contentId) return;
    if (!silent) { setLoading(true); setErr(null); }
    try {
      const res = await apiGet<AdminContentDetailDto>(`/api/admin/contents/${contentId}`);
      setDetail(res);
      setLastUpdatedAt(Date.now());
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load detail");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [contentId]);

  React.useEffect(() => { fetchDetail(); }, [fetchDetail]);

  React.useEffect(() => {
    if (!polling) return;
    const id = window.setInterval(() => fetchDetail({ silent: true }), pollMs);
    return () => window.clearInterval(id);
  }, [polling, pollMs, fetchDetail]);

  // Load categories and genres when edit tab is first opened
  React.useEffect(() => {
    if (tab === "edit") {
      if (categories.length === 0) {
        apiGet<AdminCategoryResult[]>("/api/admin/categories")
          .then(setCategories)
          .catch(() => {});
      }
      if (genres.length === 0) {
        apiGet<AdminGenreResult[]>("/api/admin/genres")
          .then(setGenres)
          .catch(() => {});
      }
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
    if (!detail?.videoAssetId) return;
    try {
      await apiPost(`/api/admin/video-assets/${detail.videoAssetId}/retry`, {});
      toast({ type: "success", title: "Retry requested", description: detail.videoAssetId });
      fetchDetail({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Retry failed", description: e?.message ?? "Unknown" });
    }
  }

  async function onUploadAsset() {
    if (!contentId || !uploadFile) return;
    setUploading(true);
    setUploadProgress("Uploading…");
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      const r = await fetch(`/api/admin/contents/${contentId}/assets`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `${r.status} ${r.statusText}`);
      }
      toast({ type: "success", title: "Video asset uploaded", description: "Transcoding will start automatically." });
      setUploadFile(null);
      setUploadProgress(null);
      fetchDetail({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Upload failed", description: e?.message ?? "Unknown" });
      setUploadProgress(null);
    } finally {
      setUploading(false);
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
      toast({ type: "success", title: "Metadata saved", description: "Changes applied successfully." });
      await fetchDetail({ silent: true });
      setTab("overview");
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
        genreSlugs: taxoGenreSlugs,
        tags: taxoTags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      await apiPut(`/api/admin/contents/${contentId}/taxonomy`, cmd);
      toast({ type: "success", title: "Taxonomy saved", description: "Changes applied successfully." });
      await fetchDetail({ silent: true });
      setTab("overview");
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
      toast({ type: "success", title: `Status changed to ${changeStatus}`, description: "Status updated successfully." });
      await fetchDetail({ silent: true });
      setTab("overview");
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

  function toggleGenreSlug(slug: string) {
    setTaxoGenreSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

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

  const uiStatus = String(detail.uiStatus ?? "UNKNOWN");
  const canPreview = detail.videoAssetStatus === "READY" && !!detail.streamUrl;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "preview", label: "Preview", badge: canPreview ? undefined : "N/A" },
    { key: "edit", label: "Edit" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-xl font-extrabold tracking-tight">{String(detail.title ?? "Untitled")}</div>
                <Badge tone={statusTone(uiStatus) as any}>{uiStatus}</Badge>
                <Badge tone={statusTone(detail.contentStatus) as any}>{String(detail.contentStatus ?? "-")}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--fg-secondary))]">
                <span className="font-mono text-xs">{detail.contentId}</span>
                {detail.updatedAt ? <span>• updated: {formatDate(detail.updatedAt)}</span> : null}
                {lastUpdatedAt ? (
                  <span className="text-xs text-[rgb(var(--fg-secondary))]">• refreshed: {new Date(lastUpdatedAt).toLocaleTimeString()}</span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button tone="primary" className="h-10" onClick={onTranscode}>Transcode</Button>
              {detail.videoAssetId && (
                <Button tone="danger" className="h-10" onClick={onRetry}>Retry</Button>
              )}
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

          {/* Status summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Video Asset</div>
              <div className="mt-1">
                {detail.videoAssetStatus ? (
                  <Badge tone={statusTone(detail.videoAssetStatus) as any}>{detail.videoAssetStatus}</Badge>
                ) : (
                  <span className="text-sm text-[rgb(var(--fg-secondary))]">No asset</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Latest Job</div>
              <div className="mt-1">
                {detail.latestJobStatus ? (
                  <Badge tone={statusTone(detail.latestJobStatus) as any}>{detail.latestJobStatus}</Badge>
                ) : (
                  <span className="text-sm text-[rgb(var(--fg-secondary))]">No jobs</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
              <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Attempts</div>
              <div className="mt-1 text-2xl font-extrabold">{detail.attemptCount}</div>
            </div>
            <div className={`rounded-2xl border p-4 shadow-sm ${canPreview ? "border-green-500/30 bg-green-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
              <div className={`text-xs font-semibold ${canPreview ? "text-green-400" : "text-amber-400"}`}>Playback</div>
              <div className={`mt-1 text-sm font-semibold ${canPreview ? "text-green-400" : "text-amber-400"}`}>
                {canPreview ? "Ready" : "Not available"}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs items={tabs as any} value={tab} onChange={(k) => setTab(k as any)} />
        </CardContent>
      </Card>

      {/* ─── Overview Tab ─── */}
      {tab === "overview" ? (
        <div className="space-y-4">
          <KeyValue
            cols={3}
            items={[
              { k: "Content ID", v: <span className="font-mono text-xs break-all">{detail.contentId}</span> },
              { k: "Title", v: String(detail.title ?? "-") },
              { k: "Channel", v: detail.channelName ? (
                <Link href="/admin/channels" className="text-violet-400 hover:underline">
                  {detail.channelName} <span className="text-[rgb(var(--fg-secondary))]">@{detail.channelHandle}</span>
                </Link>
              ) : "-" },
              { k: "Content Status", v: <Badge tone={statusTone(detail.contentStatus) as any}>{String(detail.contentStatus ?? "-")}</Badge> },
              { k: "UI Status", v: <Badge tone={statusTone(uiStatus) as any}>{uiStatus}</Badge> },
              { k: "Video Asset ID", v: detail.videoAssetId ? <span className="font-mono text-xs break-all">{detail.videoAssetId}</span> : "-" },
              { k: "Video Asset Status", v: detail.videoAssetStatus ? <Badge tone={statusTone(detail.videoAssetStatus) as any}>{detail.videoAssetStatus}</Badge> : "-" },
              { k: "Source Key", v: detail.sourceKey ? <span className="font-mono text-xs break-all">{detail.sourceKey}</span> : "-" },
              { k: "HLS Master Key", v: detail.hlsMasterKey ? <span className="font-mono text-xs break-all">{detail.hlsMasterKey}</span> : "-" },
              { k: "Stream URL", v: detail.streamUrl ? <span className="font-mono text-xs break-all">{detail.streamUrl}</span> : "-" },
              { k: "Thumbnail URL", v: detail.thumbnailUrl ? <span className="font-mono text-xs break-all">{detail.thumbnailUrl}</span> : "-" },
              { k: "Attempt Count", v: <span className="font-mono">{detail.attemptCount}</span> },
              { k: "Latest Job Status", v: detail.latestJobStatus ? <Badge tone={statusTone(detail.latestJobStatus) as any}>{detail.latestJobStatus}</Badge> : "-" },
              { k: "Latest Error", v: detail.latestErrorMessage ? <span className="text-red-400 text-xs">{detail.latestErrorMessage}</span> : "-" },
              { k: "Asset Error", v: detail.videoAssetErrorMessage ? <span className="text-red-400 text-xs">{detail.videoAssetErrorMessage}</span> : "-" },
              { k: "Created At", v: formatDate(detail.createdAt) },
              { k: "Updated At", v: formatDate(detail.updatedAt) },
            ]}
          />

          {/* Thumbnail preview */}
          {detail.thumbnailUrl && (
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Thumbnail</div>
              </CardHeader>
              <CardContent>
                <img
                  src={detail.thumbnailUrl}
                  alt="Thumbnail"
                  className="rounded-xl max-h-48 object-contain bg-black"
                />
              </CardContent>
            </Card>
          )}

          {/* Upload video asset */}
          {!detail.videoAssetId && (
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Upload Video Asset</div>
                <div className="text-xs text-[rgb(var(--fg-secondary))]">
                  No video asset linked. Upload a video file to create an asset and start transcoding automatically.
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="video/*"
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    disabled={uploading}
                  />
                  {uploadFile && (
                    <div className="text-xs text-[rgb(var(--fg-secondary))]">
                      {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)
                    </div>
                  )}
                  {uploadProgress && (
                    <div className="text-xs text-amber-400">{uploadProgress}</div>
                  )}
                  <Button
                    tone="primary"
                    onClick={onUploadAsset}
                    disabled={!uploadFile || uploading}
                  >
                    {uploading ? "Uploading…" : "Upload & Transcode"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Quick links</div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              {detail.streamUrl && (
                <Button tone="secondary" onClick={() => window.open(detail.streamUrl!, "_blank")}>Open HLS URL</Button>
              )}
              {detail.thumbnailUrl && (
                <Button tone="secondary" onClick={() => window.open(detail.thumbnailUrl!, "_blank")}>Open Thumbnail</Button>
              )}
              <Button tone="secondary" onClick={() => navigator.clipboard.writeText(detail.contentId).then(() => toast({ type: "info", title: "Copied Content ID" }))}>
                Copy Content ID
              </Button>
              {detail.videoAssetId && (
                <Button tone="secondary" onClick={() => navigator.clipboard.writeText(detail.videoAssetId!).then(() => toast({ type: "info", title: "Copied Asset ID" }))}>
                  Copy Asset ID
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* ─── Preview Tab (Video Player) ─── */}
      {tab === "preview" ? (
        <div className="space-y-4">
          {canPreview ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Video Player</div>
                    <div className="text-xs text-[rgb(var(--fg-secondary))] mt-1 font-mono break-all">{detail.streamUrl}</div>
                  </div>
                  <Badge tone="success">READY</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <HlsPlayer src={detail.streamUrl!} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-4">🎬</div>
                  <div className="text-lg font-semibold text-[rgb(var(--fg))]">Video not available</div>
                  <div className="mt-2 text-sm text-[rgb(var(--fg-secondary))] max-w-md">
                    {!detail.videoAssetId
                      ? "No video asset linked to this content. Upload a video first."
                      : detail.videoAssetStatus === "TRANSCODING"
                        ? "Transcoding is in progress. The player will be available once transcoding completes."
                        : detail.videoAssetStatus === "UPLOADED"
                          ? "Video is uploaded but not yet transcoded. Click Transcode to start."
                          : detail.videoAssetStatus === "FAILED"
                            ? "Transcoding failed. Check the error details and retry."
                            : "Stream URL is not available yet."}
                  </div>
                  {detail.videoAssetStatus && (
                    <div className="mt-4">
                      <Badge tone={statusTone(detail.videoAssetStatus) as any}>{detail.videoAssetStatus}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {/* ─── Edit Tab ─── */}
      {tab === "edit" ? (
        <div className="space-y-4">
          {/* Status change */}
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Change Status</div>
              <div className="text-xs text-[rgb(var(--fg-secondary))]">Current: <Badge tone={statusTone(detail.contentStatus) as any}>{String(detail.contentStatus ?? "-")}</Badge></div>
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
              <div className="text-xs text-[rgb(var(--fg-secondary))]">Assign categories, genres, and tags for catalog browsing.</div>
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Genres</label>
                  {genres.length === 0 ? (
                    <div className="text-xs text-[rgb(var(--fg-secondary))]">No genres found. Create some in the Genres page first.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {genres.map((g) => (
                        <button
                          key={g.slug}
                          type="button"
                          onClick={() => toggleGenreSlug(g.slug)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            taxoGenreSlugs.includes(g.slug)
                              ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                              : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg-secondary))] hover:bg-[rgb(var(--muted))]"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {taxoGenreSlugs.length > 0 && (
                    <div className="text-xs text-[rgb(var(--fg-secondary))]">Selected: {taxoGenreSlugs.join(", ")}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Tags (comma-separated)</label>
                  <Input
                    value={taxoTags}
                    onChange={(e) => setTaxoTags(e.target.value)}
                    placeholder="e.g. blockbuster, trending"
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
