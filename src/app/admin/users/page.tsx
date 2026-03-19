"use client";

import * as React from "react";
import { apiDelete, apiGet, apiPut } from "@/lib/http";
import { Badge, Button } from "@/components/ui";
import { useToast } from "@/components/toast";

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
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFilter]);

  async function handleChangeTier(userId: string) {
    const newTier = pendingTier[userId];
    if (!newTier) return;
    setSaving(userId);
    try {
      await apiPut(`/api/admin/users/${userId}/subscription`, { tier: newTier });
      toast({ title: "구독 플랜 변경 완료", tone: "success" });
      await refresh();
    } catch (e: unknown) {
      toast({
        title: "변경 실패",
        description: e instanceof Error ? e.message : "Unknown error",
        tone: "danger",
      });
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(userId: string, username: string) {
    if (
      !window.confirm(
        `정말로 "${username}" 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    )
      return;
    setDeleting(userId);
    try {
      await apiDelete(`/api/admin/users/${userId}`);
      toast({ title: "계정 삭제 완료", tone: "success" });
      setRows((prev) => prev.filter((r) => r.id !== userId));
    } catch (e: unknown) {
      toast({
        title: "삭제 실패",
        description: e instanceof Error ? e.message : "Unknown error",
        tone: "danger",
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
          <h1 className="text-2xl font-bold">사용자 관리</h1>
          <p className="text-sm text-zinc-500 mt-1">
            총 {rows.length}명의 사용자
          </p>
        </div>
        <Button tone="secondary" onClick={refresh} disabled={loading}>
          {loading ? "로딩 중…" : "새로고침"}
        </Button>
      </div>

      {/* Tier filter */}
      <div className="flex gap-2">
        {(["ALL", ...TIERS] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={[
              "px-3 py-1 rounded-full text-sm font-medium transition",
              tierFilter === t
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 hover:bg-zinc-50",
            ].join(" ")}
          >
            {t === "ALL" ? "전체" : t}
          </button>
        ))}
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          {err}
        </div>
      )}

      {/* Table */}
      {!loading && !err && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 uppercase tracking-wide">
                <th className="px-4 py-3">사용자명</th>
                <th className="px-4 py-3">역할</th>
                <th className="px-4 py-3">구독 플랜</th>
                <th className="px-4 py-3">이메일 인증</th>
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3">구독 만료</th>
                <th className="px-4 py-3">Stripe</th>
                <th className="px-4 py-3">플랜 변경</th>
                <th className="px-4 py-3">삭제</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-50 hover:bg-zinc-50 transition"
                  >
                    <td className="px-4 py-3 font-medium">{row.username}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={row.role === "ADMIN" ? "warning" : "neutral"}
                      >
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
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.subscriptionExpiresAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {row.stripeCustomerId
                        ? row.stripeCustomerId.slice(0, 12) + "…"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={
                            pendingTier[row.id] ?? row.subscriptionTier
                          }
                          onChange={(e) =>
                            setPendingTier((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-zinc-200 px-2 py-1 text-xs bg-white"
                        >
                          {TIERS.map((t) => (
                            <option key={t} value={t}>
                              {t}
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
                          {saving === row.id ? "…" : "저장"}
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
                        {deleting === row.id ? "…" : "삭제"}
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
        <div className="text-sm text-zinc-400 py-8 text-center">
          로딩 중…
        </div>
      )}
    </div>
  );
}
