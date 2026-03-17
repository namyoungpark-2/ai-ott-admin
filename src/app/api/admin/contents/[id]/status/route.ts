import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = "http://localhost:8080";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const r = await fetch(`${BASE}/api/admin/contents/${id}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await r.text();
  return new NextResponse(text || null, { status: r.status });
}
