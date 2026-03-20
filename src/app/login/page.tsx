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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow p-6">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-zinc-600">Username</label>
            <input
              className="mt-1 w-full rounded-xl border p-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-600">Password</label>
            <input
              className="mt-1 w-full rounded-xl border p-3"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 text-white py-3 font-medium disabled:opacity-60"
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
