import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = "http://localhost:8080";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const r = await fetch(`${BASE}/api/ops/transcoding/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}
