export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    credentials: "include", // ✅ 쿠키 기반 인증 필수
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${r.status} ${r.statusText} ${text}`);
  }
  return (await r.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${r.status} ${r.statusText} ${text}`);
  }
  return (await r.json()) as T;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T | void> {
  const r = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${r.status} ${r.statusText} ${text}`);
  }
  const text = await r.text();
  if (!text) return;
  return JSON.parse(text) as T;
}

export async function apiDelete(path: string): Promise<void> {
  const r = await fetch(path, {
    method: "DELETE",
    credentials: "include",
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${r.status} ${r.statusText} ${text}`);
  }
}

export async function apiPatch<T>(path: string, params?: Record<string, string>): Promise<T | void> {
  const url = params
    ? `${path}?${new URLSearchParams(params).toString()}`
    : path;
  const r = await fetch(url, {
    method: "PATCH",
    credentials: "include",
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${r.status} ${r.statusText} ${text}`);
  }
  const text = await r.text();
  if (!text) return;
  return JSON.parse(text) as T;
}
