function handleResponse(r: Response): void {
  if (r.status === 401 && typeof window !== "undefined") {
    const current = window.location.pathname;
    if (!current.startsWith("/login")) {
      window.location.href = `/login?next=${encodeURIComponent(current)}`;
      throw new Error("Unauthorized – redirecting to login");
    }
  }

  if (!r.ok) {
    throw new Error(`${r.status} ${r.statusText}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    credentials: "include",
  });

  handleResponse(r);
  return (await r.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  handleResponse(r);
  return (await r.json()) as T;
}
