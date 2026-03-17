import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;
  
  // 디버깅: 쿠키 확인
  if (!token) {
    const allCookies = cookieStore.getAll();
    console.log("[API] No token found. All cookies:", allCookies.map(c => c.name));
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const base = "http://localhost:8080";
  const r = await fetch(`${base}/api/admin/contents`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}
