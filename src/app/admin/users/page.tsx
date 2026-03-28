"use client";

import * as React from "react";
import { apiDelete, apiGet, apiPut } from "@/lib/http";
import { Badge, Button } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useTranslation } from "@/lib/i18n";

type UserRow = {
  id: string;
  username: string;
  role: string;
  subscriptionTier: string;
  emailVerified: boolean;
  createdAt: string;
  stripeCustomerId?: string | null;
  subscriptionExpiresAt?: string | null;
};

const TIERS = ["FREE", "BASIC", "PREMIUM"] as const;
type Tier = (typeof TIERS)[number];

function tierTone(tier: string): "neutral" | "warning" | "success" {
  if (tier === "PREMIUM") return "success";
  if (tier === "BASIC") return "warning";
  return "neutral";
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [tierFilter, setTierFilter] = React.useState<string>("ALL");
  const [pendingTier, setPendingTier] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const url =
        tierFilter === "ALL"
          ? "/api/admin/users"
          : `/api/admin/users?tier=${tierFilter}`;
      const data = await apiGet<UserRow[]>(url);
      setRows(data ?? []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("users.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFilter, lang]);

  async function handleChangeTier(userId: string) {
    const newTier = pendingTier[userId];
    if (!newTier) return;
    setSaving(userId);
    try {
      await apiPut(`/api/admin/users/${userId}/subscription`, { tier: newTier });
      toast({ title: t("users.tierChanged"), type: "success" });
      await refresh();
    } catch (e: unknown) {
      toast({
        title: t("users.tierFailed"),
        description: e instanceof Error ? e.message : "Unknown error",
        type: "error",
      });
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(userId: string, username: string) {
    if (
      !window.confirm(
        `${t("users.deleteConfirm")}\n(${username})`
      )
    )
      return;
    setDeleting(userId);
    try {
      await apiDelete(`/api/admin/users/${userId}`);
      toast({ title: t("users.deleted"), type: "success" });
      setRows((prev) => prev.filter((r) => r.id !== userId));
    } catch (e: unknown) {
      toast({
        title: t("users.deleteFailed"),
        description: e instanceof Error ? e.message : "Unknown error",
        type: "error",
      });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grad">{t("users.title")}</h1>
          <p className="text-sm text-[rgb(var(--fg))]/40 mt-1">
            {t("users.totalCount").replace("{count}", String(rows.length))}
          </p>
        </div>
        <Button tone="secondary" onClick={refresh} disabled={loading}>
          {loading ? t("common.loading") : t("common.refresh")}
        </Button>
      </div>

      {/* Tier filter */}
      <div className="flex gap-2">
        {(["ALL", ...TIERS] as const).map((tier) => (
          <button
            key={tier}
            onClick={() => setTierFilter(tier)}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-semibold transition border",
              tierFilter === tier
                ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                : "border-[rgb(var(--border))] text-[rgb(var(--fg))]/50 hover:border-violet-500/30 hover:text-[rgb(var(--fg))]/80",
            ].join(" ")}
          >
            {tier === "ALL" ? t("users.allTiers") : tier}
          </button>
        ))}
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 text-sm">
          {err}
        </div>
      )}

      {/* Table */}
      {!loading && !err && (
        <div className="overflow-x-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] text-left text-xs text-[rgb(var(--fg))]/35 uppercase tracking-wide">
                <th className="px-4 py-3">{t("users.username")}</th>
                <th className="px-4 py-3">{t("users.role")}</th>
                <th className="px-4 py-3">{t("users.subscriptionTier")}</th>
                <th className="px-4 py-3">{t("users.emailVerified")}</th>
                <th className="px-4 py-3">{t("field.createdAt")}</th>
                <th className="px-4 py-3">{t("users.subscriptionExpiry")}</th>
                <th className="px-4 py-3">{t("users.stripe")}</th>
                <th className="px-4 py-3">{t("users.changeTierCol")}</th>
                <th className="px-4 py-3">{t("common.delete")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-[rgb(var(--fg))]/30 text-sm"
                  >
                    {t("users.noUsers")}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[rgb(var(--border))]/60 hover:bg-[rgb(var(--muted))]/60 transition"
                  >
                    <td className="px-4 py-3 font-medium text-[rgb(var(--fg))]/90">
                      {row.username}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={row.role === "ADMIN" ? "brand" : "neutral"}>
                        {row.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tierTone(row.subscriptionTier)}>
                        {row.subscriptionTier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.emailVerified ? (
                        <span className="text-emerald-400 font-semibold">✓</span>
                      ) : (
                        <span className="text-[rgb(var(--fg))]/25">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--fg))]/45">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-[rgb(var(--fg))]/45">
                      {formatDate(row.subscriptionExpiresAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[rgb(var(--fg))]/30">
                      {row.stripeCustomerId
                        ? row.stripeCustomerId.slice(0, 12) + "…"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={pendingTier[row.id] ?? row.subscriptionTier}
                          onChange={(e) =>
                            setPendingTier((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted))] text-[rgb(var(--fg))]/80 px-2 py-1 text-xs outline-none focus:border-violet-500/50 transition"
                        >
                          {TIERS.map((tier) => (
                            <option key={tier} value={tier}>
                              {tier}
                            </option>
                          ))}
                        </select>
                        <Button
                          tone="primary"
                          className="text-xs px-2 py-1"
                          disabled={
                            saving === row.id ||
                            (pendingTier[row.id] ?? row.subscriptionTier) ===
                              row.subscriptionTier
                          }
                          onClick={() => handleChangeTier(row.id)}
                        >
                          {saving === row.id ? "…" : t("users.changeTier")}
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        tone="danger"
                        className="text-xs px-2 py-1"
                        disabled={deleting === row.id}
                        onClick={() => handleDelete(row.id, row.username)}
                      >
                        {deleting === row.id ? "…" : t("common.delete")}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="text-sm text-[rgb(var(--fg))]/30 py-12 text-center">
          {t("common.loading")}
        </div>
      )}
    </div>
  );
}
