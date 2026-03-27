const STORAGE_KEY = "admin_lang";

function getLang(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(STORAGE_KEY) || "en";
}

function baseHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Accept-Language": getLang(),
  };
}

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
    headers: baseHeaders(),
    cache: "no-store",
    credentials: "include",
  });

  handleResponse(r);
  return (await r.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: baseHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  handleResponse(r);
  return (await r.json()) as T;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T | void> {
  const r = await fetch(path, {
    method: "PUT",
    headers: baseHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  handleResponse(r);
  const text = await r.text();
  if (!text) return;
  return JSON.parse(text) as T;
}

export async function apiDelete(path: string): Promise<void> {
  const r = await fetch(path, {
    method: "DELETE",
    headers: { "Accept-Language": getLang() },
    credentials: "include",
  });
  handleResponse(r);
}

export async function apiPatch<T>(path: string, params?: Record<string, string>): Promise<T | void> {
  const url = params
    ? `${path}?${new URLSearchParams(params).toString()}`
    : path;
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Accept-Language": getLang() },
    credentials: "include",
  });

  handleResponse(r);
  const text = await r.text();
  if (!text) return;
  return JSON.parse(text) as T;
}
