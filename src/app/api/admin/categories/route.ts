import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = "http://localhost:8080";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_access_token")?.value ?? null;
}

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const r = await fetch(`${BASE}/api/admin/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.text();
  const r = await fetch(`${BASE}/api/admin/categories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body,
  });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}
