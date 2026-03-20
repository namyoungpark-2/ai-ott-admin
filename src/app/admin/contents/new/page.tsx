"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiPost } from "@/lib/http";
import type { AdminCreateContentCommand } from "@/lib/types";

export default function NewContentPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [mode, setMode] = React.useState<"MOVIE" | "EPISODE">("MOVIE");
  const [title, setTitle] = React.useState("");
  const [seriesId, setSeriesId] = React.useState("");
  const [seriesTitle, setSeriesTitle] = React.useState("");
  const [seasonNumber, setSeasonNumber] = React.useState("");
  const [episodeNumber, setEpisodeNumber] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast({ type: "error", title: "Title is required" });
      return;
    }

    const cmd: AdminCreateContentCommand = {
      mode,
      title: title.trim(),
      ...(mode === "EPISODE" && {
        seriesId: seriesId.trim() || undefined,
        seriesTitle: seriesTitle.trim() || undefined,
        seasonNumber: seasonNumber ? Number(seasonNumber) : undefined,
        episodeNumber: episodeNumber ? Number(episodeNumber) : undefined,
      }),
    };

    setLoading(true);
    try {
      const result = await apiPost<{ contentId: string }>("/api/admin/contents", cmd);
      toast({ type: "success", title: "Content created", description: result.contentId });
      router.push(`/admin/contents/${result.contentId}`);
    } catch (e: any) {
      toast({ type: "error", title: "Failed to create content", description: e?.message ?? "Unknown" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <div className="text-lg font-extrabold tracking-tight">New Content</div>
        <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">Create a content record (without uploading a video).</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Mode */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Type</label>
              <div className="flex gap-2">
                {(["MOVIE", "EPISODE"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      mode === m
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Title *</label>
              <Input
                placeholder="Content title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Episode fields */}
            {mode === "EPISODE" && (
              <Card>
                <CardHeader>
                  <div className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Series info</div>
                  <div className="text-xs text-[rgb(var(--fg-secondary))]">Provide an existing series ID, or a new series title to create one.</div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Existing Series ID (UUID)</label>
                    <Input
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={seriesId}
                      onChange={(e) => setSeriesId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">New Series Title</label>
                    <Input
                      placeholder="My Series (creates a new series)"
                      value={seriesTitle}
                      onChange={(e) => setSeriesTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Season #</label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={seasonNumber}
                        onChange={(e) => setSeasonNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Episode #</label>
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

            <div className="flex gap-2 pt-2">
              <Button type="submit" tone="primary" disabled={loading || !title.trim()}>
                {loading ? "Creating…" : "Create Content"}
              </Button>
              <Button type="button" tone="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
