"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { apiGet, apiPost } from "@/lib/http"; // 너희 기존 유틸에 맞춤
import { Badge, Button } from "@/components/ui";
import { DataTable } from "@/components/table/DataTable";
import { actionsColumn, selectColumn } from "@/components/table/columns";
import { useToast } from "@/components/toast";
import { useTranslation } from "@/lib/i18n";

type ContentRow = {
  contentId: string;
  title?: string;
  uiStatus?: string;
  contentStatus?: string;
  latestJobStatus?: string;
  attemptCount?: number;
  updatedAt?: string;
  channelHandle?: string;
  channelName?: string;
};

function statusTone(s?: string) {
  const v = (s ?? "").toUpperCase();
  if (v.includes("FAIL")) return "danger";
  if (v.includes("READY") || v.includes("SUCCESS") || v.includes("DONE")) return "success";
  if (v.includes("PROCESS") || v.includes("RUN")) return "warning";
  return "neutral";
}

export default function AdminContentsPage() {
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<ContentRow[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      // ✅ 너희 API에 맞춰 경로만 맞춰줘
      const res = await apiGet<ContentRow[]>("/api/admin/contents");
      setRows(res ?? []);
    } catch (e: any) {
      setErr(e?.message ?? t("contents.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
  }, [lang]);

  const columns = React.useMemo<ColumnDef<ContentRow>[]>(() => {
    return [
      selectColumn<ContentRow>(),
      {
        accessorKey: "contentId",
        header: t("contents.contentId"),
        cell: ({ row, getValue }) => (
          <Link
            className="font-mono text-xs text-[rgb(var(--fg))] hover:underline"
            href={`/admin/contents/${row.original.contentId}`}
          >
            {String(getValue() ?? "")}
          </Link>
        ),
      },
      {
        accessorKey: "title",
        header: t("field.title"),
        cell: ({ getValue }) => <div className="max-w-[520px] truncate">{String(getValue() ?? "")}</div>,
      },
      {
        accessorKey: "channelName",
        header: t("field.channel"),
        cell: ({ row }) => {
          const name = row.original.channelName;
          const handle = row.original.channelHandle;
          if (!name && !handle) return <span className="text-[rgb(var(--fg-secondary))] text-xs">-</span>;
          return (
            <Link
              href="/admin/channels"
              className="text-xs hover:underline text-violet-400"
              title={handle ? `@${handle}` : undefined}
            >
              {name ?? `@${handle}`}
            </Link>
          );
        },
      },
      {
        accessorKey: "uiStatus",
        header: t("contents.uiStatus"),
        cell: ({ getValue }) => <Badge tone={statusTone(String(getValue() ?? "")) as any}>{String(getValue() ?? "-")}</Badge>,
      },
      {
        accessorKey: "latestJobStatus",
        header: t("contents.latestJob"),
        cell: ({ getValue }) => <Badge tone={statusTone(String(getValue() ?? "")) as any}>{String(getValue() ?? "-")}</Badge>,
      },
      {
        accessorKey: "attemptCount",
        header: t("contents.attempts"),
        cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? 0)}</span>,
      },
      {
        accessorKey: "updatedAt",
        header: t("contents.updated"),
        cell: ({ getValue }) => <span className="text-[rgb(var(--fg-secondary))]">{String(getValue() ?? "-")}</span>,
      },
      actionsColumn<ContentRow>(),
    ];
  }, [t]);

  if (loading) {
    // 제품급: 로딩도 table skeleton으로 만들 수 있지만, 일단 최소로
    return <div className="text-sm text-[rgb(var(--fg-secondary))]">{t("common.loading")}</div>;
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="font-semibold text-red-400">{t("contents.loadFailed")}</div>
        <div className="mt-1 text-sm text-red-400">{err}</div>
        <div className="mt-4">
          <Button tone="secondary" onClick={refresh}>{t("common.retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold tracking-tight">{t("contents.title")}</div>
          <div className="mt-1 text-sm text-[rgb(var(--fg-secondary))]">{t("contents.desc")}</div>
        </div>

        <div className="flex gap-2">
          <Button tone="secondary" className="h-10" onClick={() => (window.location.href = "/admin/contents/new")}>
            {t("contents.newContent")}
          </Button>
          <Button tone="primary" className="h-10" onClick={() => (window.location.href = "/admin/upload")}>
            {t("nav.upload")}
          </Button>
        </div>
      </div>

      <DataTable<ContentRow>
        title={undefined}
        description={undefined}
        data={rows}
        columns={columns}
        searchPlaceholder={t("contents.searchPlaceholder")}
        globalSearchText={(r) => `${r.title ?? ""} ${r.contentId ?? ""} ${r.uiStatus ?? ""} ${r.latestJobStatus ?? ""} ${r.channelName ?? ""} ${r.channelHandle ?? ""}`}
        rowActions={[
          {
            label: t("contents.transcode"),
            onClick: async (r) => {
              try {
                await apiPost(`/api/admin/contents/${r.contentId}/transcode`, {});
                toast({ type: "success", title: t("contents.transcodeStarted"), description: r.contentId });
                refresh();
              } catch (e: any) {
                toast({ type: "error", title: t("contents.transcodeFailed"), description: e?.message ?? "Unknown" });
              }
            },
          },
          {
            label: t("contents.openDetail"),
            onClick: (r) => {
              window.location.href = `/admin/contents/${r.contentId}`;
            },
          },
        ]}
        initialPageSize={20}
        initialDensity="compact"
      />
    </div>
  );
}
