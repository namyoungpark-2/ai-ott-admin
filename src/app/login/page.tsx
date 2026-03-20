"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiPost } from "@/lib/http";
import { useAuth } from "@/components/auth/AuthProvider";

function LoginForm() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sp = useSearchParams();
  const router = useRouter();
  const { me, refresh } = useAuth();
  const next = sp.get("next") || "/admin/contents";

  // 이미 로그인된 상태면 바로 이동
  if (me) {
    router.replace(next);
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiPost<{ ok: boolean }>("/api/auth/admin/login", { username, password });
      await refresh();
      router.replace(next);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[rgb(var(--bg))]">
      <div className="w-full max-w-md rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-2xl p-8">
        <div className="text-center mb-2">
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-grad">AI</span>{" "}
            <span className="text-[rgb(var(--fg))]">OTT</span>
          </span>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium text-[rgb(var(--fg-secondary))]">Username</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted))] text-[rgb(var(--fg))] placeholder-zinc-500 p-3 outline-none focus:border-[rgb(var(--brand))] focus:ring-1 focus:ring-[rgb(var(--brand))] transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[rgb(var(--fg-secondary))]">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted))] text-[rgb(var(--fg))] placeholder-zinc-500 p-3 outline-none focus:border-[rgb(var(--brand))] focus:ring-1 focus:ring-[rgb(var(--brand))] transition"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="btn-primary w-full py-3 text-sm"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
