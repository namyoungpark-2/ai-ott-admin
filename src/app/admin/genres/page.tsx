"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { DataTable } from "@/components/table/DataTable";
import { useToast } from "@/components/toast";
import { apiGet, apiPost } from "@/lib/http";
import { useLanguage } from "@/components/language/LanguageProvider";
import type { AdminGenreResult } from "@/lib/types";

export default function GenresPage() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const [rows, setRows] = React.useState<AdminGenreResult[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [slug, setSlug] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiGet<AdminGenreResult[]>("/api/admin/genres");
      setRows(res ?? []);
    } catch (e: any) {
      toast({ type: "error", title: "Failed to load genres", description: e?.message });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !label.trim()) {
      toast({ type: "error", title: "Slug and label are required" });
      return;
    }
    setCreating(true);
    try {
      await apiPost("/api/admin/genres", {
        slug: slug.trim(),
        label: label.trim(),
        description: description.trim() || undefined,
        lang,
      });
      toast({ type: "success", title: "Genre created" });
      setSlug(""); setLabel(""); setDescription("");
      refresh();
    } catch (e: any) {
      toast({ type: "error", title: "Failed to create genre", description: e?.message });
    } finally {
      setCreating(false);
    }
  }

  const columns = React.useMemo<ColumnDef<AdminGenreResult>[]>(() => [
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span>,
    },
    { accessorKey: "label", header: "Label" },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))] text-xs">{String(getValue() ?? "-")}</span>,
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-extrabold tracking-tight">Genres</div>
        <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">Manage content genres for catalog filtering and browsing.</div>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Create Genre</div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Slug *</label>
                <Input
                  placeholder="e.g. action"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Label *</label>
                <Input
                  placeholder="e.g. Action"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Description</label>
              <Input
                placeholder="e.g. Action and adventure"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" tone="primary" disabled={creating || !slug.trim() || !label.trim()}>
              {creating ? "Creating…" : "Create Genre"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <DataTable<AdminGenreResult>
        title="All Genres"
        description="Genres are used to classify content for filtering and browsing."
        data={rows}
        columns={columns}
        searchPlaceholder="Search by slug or label…"
        globalSearchText={(r) => `${r.slug} ${r.label} ${r.description ?? ""}`}
        initialDensity="compact"
        initialPageSize={20}
      />
    </div>
  );
}
