"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { DataTable } from "@/components/table/DataTable";
import { useToast } from "@/components/toast";
import { apiGet, apiPost } from "@/lib/http";
import { useTranslation } from "@/lib/i18n";
import type { AdminGenreResult } from "@/lib/types";

export default function GenresPage() {
  const { toast } = useToast();
  const { t, lang } = useTranslation();
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
      toast({ type: "error", title: t("genres.loadFailed"), description: e?.message });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); }, [lang]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !label.trim()) {
      toast({ type: "error", title: t("categories.slugRequired") });
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
      toast({ type: "success", title: t("genres.created") });
      setSlug(""); setLabel(""); setDescription("");
      refresh();
    } catch (e: any) {
      toast({ type: "error", title: t("genres.createFailed"), description: e?.message });
    } finally {
      setCreating(false);
    }
  }

  const columns = React.useMemo<ColumnDef<AdminGenreResult>[]>(() => [
    {
      accessorKey: "slug",
      header: t("categories.slug"),
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span>,
    },
    { accessorKey: "label", header: t("categories.label") },
    {
      accessorKey: "description",
      header: t("field.description"),
      cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))] text-xs">{String(getValue() ?? "-")}</span>,
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-extrabold tracking-tight">{t("genres.title")}</div>
        <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">{t("genres.desc")}</div>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">{t("genres.createGenre")}</div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">{t("categories.slug")} *</label>
                <Input
                  placeholder="e.g. action"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">{t("categories.label")} *</label>
                <Input
                  placeholder="e.g. Action"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">{t("field.description")}</label>
              <Input
                placeholder="e.g. Action and adventure"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" tone="primary" disabled={creating || !slug.trim() || !label.trim()}>
              {creating ? t("common.creating") : t("genres.createGenre")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <DataTable<AdminGenreResult>
        title={t("genres.allGenres")}
        description={t("genres.tableDesc")}
        data={rows}
        columns={columns}
        searchPlaceholder={t("genres.searchPlaceholder")}
        globalSearchText={(r) => `${r.slug} ${r.label} ${r.description ?? ""}`}
        initialDensity="compact"
        initialPageSize={20}
      />
    </div>
  );
}
