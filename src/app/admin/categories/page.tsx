"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { DataTable } from "@/components/table/DataTable";
import { useToast } from "@/components/toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/http";
import type { AdminCategoryResult } from "@/lib/types";

export default function CategoriesPage() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<AdminCategoryResult[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Create form state
  const [slug, setSlug] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("0");
  const [active, setActive] = React.useState(true);
  const [iabCode, setIabCode] = React.useState("");
  const [tier, setTier] = React.useState("1");
  const [parentSlug, setParentSlug] = React.useState("");
  const [lang, setLang] = React.useState("en");
  const [creating, setCreating] = React.useState(false);

  // Edit state
  const [editing, setEditing] = React.useState<AdminCategoryResult | null>(null);
  const [editLabel, setEditLabel] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editSortOrder, setEditSortOrder] = React.useState("0");
  const [editActive, setEditActive] = React.useState(true);
  const [editIabCode, setEditIabCode] = React.useState("");
  const [editTier, setEditTier] = React.useState("1");
  const [editParentSlug, setEditParentSlug] = React.useState("");
  const [saving, setSaving] = React.useState(false);

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
        iabCode: iabCode.trim() || undefined,
        tier: Number(tier),
        parentSlug: parentSlug.trim() || undefined,
        lang,
      });
      toast({ type: "success", title: "Category created" });
      setSlug(""); setLabel(""); setDescription(""); setSortOrder("0");
      setActive(true); setIabCode(""); setTier("1"); setParentSlug(""); setLang("en");
      refresh();
    } catch (e: any) {
      toast({ type: "error", title: "Failed to create", description: e?.message });
    } finally {
      setCreating(false);
    }
  }

  function openEdit(row: AdminCategoryResult) {
    setEditing(row);
    setEditLabel(row.label);
    setEditDescription(row.description ?? "");
    setEditSortOrder(String(row.sortOrder));
    setEditActive(row.active);
    setEditIabCode(row.iabCode ?? "");
    setEditTier(String(row.tier ?? 1));
    setEditParentSlug(row.parentSlug ?? "");
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editLabel.trim()) {
      toast({ type: "error", title: "Label is required" });
      return;
    }
    setSaving(true);
    try {
      await apiPut(`/api/admin/categories/${encodeURIComponent(editing.slug)}`, {
        label: editLabel.trim(),
        description: editDescription.trim() || undefined,
        sortOrder: Number(editSortOrder),
        active: editActive,
        iabCode: editIabCode.trim() || undefined,
        tier: Number(editTier),
        parentSlug: editParentSlug.trim() || undefined,
      });
      toast({ type: "success", title: "Category updated" });
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast({ type: "error", title: "Failed to update", description: e?.message });
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = React.useMemo(
    () => rows.filter((r) => r.tier === 1 || r.parentSlug === null),
    [rows]
  );

  async function bulkSetActive(selectedRows: AdminCategoryResult[], value: boolean) {
    const label = value ? "Activate" : "Deactivate";
    try {
      await Promise.all(
        selectedRows.map((row) =>
          apiPut(`/api/admin/categories/${encodeURIComponent(row.slug)}`, {
            label: row.label,
            description: row.description ?? undefined,
            sortOrder: row.sortOrder,
            active: value,
            iabCode: row.iabCode ?? undefined,
            tier: row.tier ?? undefined,
            parentSlug: row.parentSlug ?? undefined,
          })
        )
      );
      toast({ type: "success", title: `${label}d ${selectedRows.length} categories` });
      refresh();
    } catch (e: any) {
      toast({ type: "error", title: `Failed to ${label.toLowerCase()}`, description: e?.message });
    }
  }

  const columns = React.useMemo<ColumnDef<AdminCategoryResult>[]>(() => [
    {
      id: "__select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? "")}</span>,
    },
    { accessorKey: "label", header: "Label" },
    {
      accessorKey: "tier",
      header: "Tier",
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() != null ? String(getValue()) : "-"}</span>,
    },
    {
      accessorKey: "parentSlug",
      header: "Parent",
      cell: ({ getValue }) => {
        const v = getValue();
        return v ? <span className="font-mono text-xs">{String(v)}</span> : <span className="text-[rgb(var(--fg-secondary))] text-xs">-</span>;
      },
    },
    {
      accessorKey: "iabCode",
      header: "IAB Code",
      cell: ({ getValue }) => {
        const v = getValue();
        return v ? <span className="font-mono text-xs">{String(v)}</span> : <span className="text-[rgb(var(--fg-secondary))] text-xs">-</span>;
      },
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
    {
      id: "__actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
    },
  ], []);

  async function onDelete(row: AdminCategoryResult) {
    if (!confirm(`Delete category "${row.label}" (${row.slug})?`)) return;
    try {
      await apiDelete(`/api/admin/categories/${encodeURIComponent(row.slug)}`);
      toast({ type: "success", title: "Category deleted" });
      refresh();
    } catch (e: any) {
      toast({ type: "error", title: "Failed to delete", description: e?.message });
    }
  }

  async function bulkDelete(selectedRows: AdminCategoryResult[]) {
    if (!confirm(`Delete ${selectedRows.length} categories?`)) return;
    try {
      await Promise.all(
        selectedRows.map((row) =>
          apiDelete(`/api/admin/categories/${encodeURIComponent(row.slug)}`)
        )
      );
      toast({ type: "success", title: `Deleted ${selectedRows.length} categories` });
      refresh();
    } catch (e: any) {
      toast({ type: "error", title: "Failed to delete", description: e?.message });
    }
  }

  const rowActions = React.useMemo(() => [
    {
      label: "Edit",
      onClick: (row: AdminCategoryResult) => openEdit(row),
    },
    {
      label: "Delete",
      onClick: (row: AdminCategoryResult) => onDelete(row),
      tone: "danger" as const,
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-extrabold tracking-tight">Categories</div>
        <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">Manage content categories used for catalog browsing.</div>
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
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Slug *</label>
                <Input
                  placeholder="e.g. tv-comedy"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Label *</label>
                <Input
                  placeholder="e.g. TV Comedy"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Description</label>
              <Input
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">IAB Code</label>
                <Input
                  placeholder="e.g. IAB1-1"
                  value={iabCode}
                  onChange={(e) => setIabCode(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Tier</label>
                <select
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                >
                  <option value="1">Tier 1 (Top-level)</option>
                  <option value="2">Tier 2 (Sub-category)</option>
                  <option value="3">Tier 3</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Parent Category</label>
                <select
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                  value={parentSlug}
                  onChange={(e) => setParentSlug(e.target.value)}
                >
                  <option value="">None (top-level)</option>
                  {parentOptions.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label} ({c.slug})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Language</label>
                <select
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                >
                  <option value="en">English (en)</option>
                  <option value="ko">Korean (ko)</option>
                  <option value="ja">Japanese (ja)</option>
                  <option value="zh">Chinese (zh)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Sort Order</label>
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

      {/* Edit dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditing(null)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-4">
              <div>
                <div className="text-sm font-semibold">Edit Category</div>
                <div className="mt-0.5 text-xs text-[rgb(var(--fg-secondary))] font-mono">{editing.slug}</div>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="h-8 w-8 rounded-lg text-[rgb(var(--fg-secondary))] hover:bg-[rgb(var(--muted))] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSaveEdit} className="p-6 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Label *</label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Description</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">IAB Code</label>
                  <Input
                    value={editIabCode}
                    onChange={(e) => setEditIabCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Tier</label>
                  <select
                    className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value)}
                  >
                    <option value="1">Tier 1 (Top-level)</option>
                    <option value="2">Tier 2 (Sub-category)</option>
                    <option value="3">Tier 3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Parent Category</label>
                  <select
                    className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
                    value={editParentSlug}
                    onChange={(e) => setEditParentSlug(e.target.value)}
                  >
                    <option value="">None (top-level)</option>
                    {parentOptions
                      .filter((c) => c.slug !== editing.slug)
                      .map((c) => (
                        <option key={c.slug} value={c.slug}>{c.label} ({c.slug})</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--fg-secondary))]">Sort Order</label>
                  <Input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  Active
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" tone="primary" disabled={saving || !editLabel.trim()}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button type="button" tone="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        rowActions={rowActions}
        bulkActions={[
          {
            label: "Activate",
            onClick: (selected) => bulkSetActive(selected, true),
          },
          {
            label: "Deactivate",
            onClick: (selected) => bulkSetActive(selected, false),
          },
          {
            label: "Delete",
            onClick: (selected) => bulkDelete(selected),
            tone: "danger",
          },
        ]}
      />
    </div>
  );
}
