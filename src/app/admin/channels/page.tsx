"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { DataTable } from "@/components/table/DataTable";
import { useToast } from "@/components/toast";
import { apiGet, apiPatch } from "@/lib/http";
import { useLanguage } from "@/components/language/LanguageProvider";
import type { AdminChannelResult } from "@/lib/types";

export default function ChannelsPage() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const [rows, setRows] = React.useState<AdminChannelResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toggling, setToggling] = React.useState<string | null>(null);

  // Confirm dialog state
  const [confirmTarget, setConfirmTarget] = React.useState<AdminChannelResult | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiGet<AdminChannelResult[]>("/api/admin/channels?limit=50");
      setRows(res ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ type: "error", title: "Failed to load channels", description: msg });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { refresh(); }, [lang]);

  async function handleToggleStatus(channel: AdminChannelResult) {
    const newStatus = channel.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    // If suspending, require confirmation
    if (newStatus === "SUSPENDED") {
      setConfirmTarget(channel);
      return;
    }

    await executeToggle(channel, newStatus);
  }

  async function executeToggle(channel: AdminChannelResult, newStatus: string) {
    setToggling(channel.id);
    try {
      await apiPatch(`/api/admin/channels/${channel.id}/status`, { status: newStatus });
      toast({
        type: "success",
        title: newStatus === "SUSPENDED"
          ? `Channel @${channel.handle} suspended`
          : `Channel @${channel.handle} activated`,
      });
      refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ type: "error", title: "Failed to update status", description: msg });
    } finally {
      setToggling(null);
    }
  }

  function confirmSuspend() {
    if (!confirmTarget) return;
    executeToggle(confirmTarget, "SUSPENDED");
    setConfirmTarget(null);
  }

  const columns = React.useMemo<ColumnDef<AdminChannelResult>[]>(() => [
    {
      accessorKey: "handle",
      header: "Handle",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          @{row.original.handle}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          {row.original.profileImageUrl && (
            <img
              src={row.original.profileImageUrl}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          )}
          <span className="font-medium">{row.original.name}</span>
          {row.original.isOfficial && (
            <Badge tone="brand">Official</Badge>
          )}
        </span>
      ),
    },
    {
      accessorKey: "subscriberCount",
      header: "Subscribers",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">
          {Number(getValue()).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) =>
        getValue() === "ACTIVE" ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="danger">Suspended</Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const ch = row.original;
        const isSuspending = toggling === ch.id;
        return ch.status === "ACTIVE" ? (
          <Button
            tone="danger"
            disabled={isSuspending}
            onClick={() => handleToggleStatus(ch)}
          >
            {isSuspending ? "…" : "Suspend"}
          </Button>
        ) : (
          <Button
            tone="primary"
            disabled={isSuspending}
            onClick={() => handleToggleStatus(ch)}
          >
            {isSuspending ? "…" : "Activate"}
          </Button>
        );
      },
    },
  ], [toggling]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-extrabold tracking-tight">Channels</div>
        <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">
          Manage creator and official channels. Suspend channels that violate policies.
        </div>
      </div>

      <DataTable<AdminChannelResult>
        title="All Channels"
        description="Channels are user-created or official content hubs."
        data={rows}
        columns={columns}
        searchPlaceholder="Search by handle or name…"
        globalSearchText={(r) => `${r.handle} ${r.name}`}
        initialDensity="compact"
        initialPageSize={20}
      />

      {/* Suspend confirm dialog */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirmTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-4">
              <div className="text-sm font-semibold">Confirm Suspension</div>
              <button
                onClick={() => setConfirmTarget(null)}
                className="h-8 w-8 rounded-lg text-[rgb(var(--fg-secondary))] hover:bg-[rgb(var(--muted))] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <Card>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">
                    Are you sure you want to suspend channel{" "}
                    <strong>@{confirmTarget.handle}</strong> ({confirmTarget.name})?
                  </p>
                  <p className="text-xs text-[rgb(var(--fg-secondary))]">
                    Suspended channels will not be visible to users and cannot publish new content.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button tone="danger" onClick={confirmSuspend}>
                      Suspend Channel
                    </Button>
                    <Button tone="secondary" onClick={() => setConfirmTarget(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
