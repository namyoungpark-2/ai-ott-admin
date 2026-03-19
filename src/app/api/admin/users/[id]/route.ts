import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_access_token")?.value ?? null;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const r = await fetch(`${BASE}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return new NextResponse(await r.text(), { status: r.status });
}
