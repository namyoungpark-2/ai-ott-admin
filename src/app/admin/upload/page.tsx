"use client";

import React, { useState } from "react";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiPost } from "@/lib/http";

export default function AdminUploadPage() {
  const { toast } = useToast();

  const [mode, setMode] = useState<"MOVIE" | "EPISODE">("MOVIE");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [autoTranscode, setAutoTranscode] = useState(true);
  const [loading, setLoading] = useState(false);

  // Episode fields
  const [seriesId, setSeriesId] = useState("");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast({ type: "error", title: "Please select a file" });
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      if (title) fd.append("title", title);
      if (mode === "EPISODE") {
        if (seriesId.trim()) fd.append("seriesId", seriesId.trim());
        if (seriesTitle.trim()) fd.append("seriesTitle", seriesTitle.trim());
        if (seasonNumber) fd.append("seasonNumber", seasonNumber);
        if (episodeNumber) fd.append("episodeNumber", episodeNumber);
      }

      const r = await fetch("/api/admin/uploads", { method: "POST", body: fd });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(text);
      }

      const json = await r.json();
      const contentId = json.id;

      toast({ type: "success", title: "Upload complete", description: `contentId=${contentId}` });

      if (autoTranscode && contentId) {
        try {
          await apiPost(`/api/admin/contents/${contentId}/transcode`, {});
          toast({ type: "success", title: "Transcode started" });
        } catch {
          toast({ type: "error", title: "Transcode failed to start" });
        }
      }

      window.location.href = `/admin/contents/${contentId}`;
    } catch (e: any) {
      toast({ type: "error", title: "Upload failed", description: e?.message ?? "Unknown" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <div className="text-lg font-extrabold tracking-tight">Upload Content</div>
        <div className="mt-1 text-sm text-zinc-500">Upload a video file and optionally auto-transcode.</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Mode */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Type</label>
              <div className="flex gap-2">
                {(["MOVIE", "EPISODE"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      mode === m
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Title</label>
              <Input
                placeholder="Content title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Episode fields */}
            {mode === "EPISODE" && (
              <Card>
                <CardHeader>
                  <div className="text-xs font-semibold text-zinc-600">Series info</div>
                  <div className="text-xs text-zinc-400">Provide an existing series ID or a new series title.</div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">Series ID (existing)</label>
                    <Input
                      placeholder="UUID of existing series"
                      value={seriesId}
                      onChange={(e) => setSeriesId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">Series Title (new)</label>
                    <Input
                      placeholder="Creates a new series"
                      value={seriesTitle}
                      onChange={(e) => setSeriesTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600">Season #</label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={seasonNumber}
                        onChange={(e) => setSeasonNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-600">Episode #</label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={episodeNumber}
                        onChange={(e) => setEpisodeNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Video File *</label>
              <input
                type="file"
                accept="video/*"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoTranscode}
                onChange={(e) => setAutoTranscode(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Auto-transcode after upload
            </label>

            <Button type="submit" tone="primary" disabled={!file || loading}>
              {loading ? "Uploading…" : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
