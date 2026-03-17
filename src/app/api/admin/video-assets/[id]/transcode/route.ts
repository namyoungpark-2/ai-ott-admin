import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const r = await fetch(`${base}/api/admin/video-assets/${id}/transcode`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}
