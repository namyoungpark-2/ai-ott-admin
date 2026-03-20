import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_access_token")?.value ?? null;
}

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier");
  const url = tier
    ? `${BASE}/api/admin/users?tier=${encodeURIComponent(tier)}`
    : `${BASE}/api/admin/users`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return new NextResponse(await r.text(), { status: r.status });
}
