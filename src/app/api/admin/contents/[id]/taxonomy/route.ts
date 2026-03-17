import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = "http://localhost:8080";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.text();
  const r = await fetch(`${BASE}/api/admin/contents/${id}/taxonomy`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body,
  });
  const text = await r.text();
  return new NextResponse(text || null, { status: r.status });
}
