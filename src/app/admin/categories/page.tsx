"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { DataTable } from "@/components/table/DataTable";
import { useToast } from "@/components/toast";
import { apiGet, apiPost } from "@/lib/http";
import type { AdminCategoryResult } from "@/lib/types";

export default function CategoriesPage() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<AdminCategoryResult[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [slug, setSlug] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("0");
  const [active, setActive] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiGet<AdminCategoryResult[]>("/api/admin/categories");
      setRows(res ?? []);
    } catch (e: any) {
      toast({ type: "error", title: "Failed to load categories", description: e?.message });
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
      await apiPost("/api/admin/categories", {
        slug: slug.trim(),
        label: label.trim(),
        description: description.trim() || undefined,
        sortOrder: Number(sortOrder),
        active,
      });
      toast({ type: "success", title: "Category created" });
      setSlug(""); setLabel(""); setDescription(""); setSortOrder("0"); setActive(true);
      refresh();
    } catch (e: any) {
      toast({ type: "error", title: "Failed to create", description: e?.message });
    } finally {
      setCreating(false);
    }
  }

  const columns = React.useMemo<ColumnDef<AdminCategoryResult>[]>(() => [
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span>,
    },
    { accessorKey: "label", header: "Label" },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => <span className="text-zinc-500 text-xs">{String(getValue() ?? "-")}</span>,
    },
    {
      accessorKey: "sortOrder",
      header: "Sort",
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? 0)}</span>,
    },
    {
      accessorKey: "active",
      header: "Active",
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="neutral">Inactive</Badge>
        ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-extrabold tracking-tight">Categories</div>
        <div className="mt-1 text-sm text-zinc-500">Manage content categories used for catalog browsing.</div>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Create Category</div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600">Slug *</label>
                <Input
                  placeholder="e.g. action"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600">Label *</label>
                <Input
                  placeholder="e.g. Action"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Description</label>
              <Input
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600">Sort Order</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Active
                </label>
              </div>
            </div>
            <Button type="submit" tone="primary" disabled={creating || !slug.trim() || !label.trim()}>
              {creating ? "Creating…" : "Create Category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <DataTable<AdminCategoryResult>
        title="All Categories"
        description="Categories are used to classify content for catalog browsing."
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
