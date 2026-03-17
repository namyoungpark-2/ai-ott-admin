import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;
  
  if (!token) {
    // 디버깅: 토큰이 없을 때만 로그
    const allCookies = cookieStore.getAll();
    console.warn("[API] No token found. All cookies:", allCookies.map(c => c.name));
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const base = "http://localhost:8080";
  const r = await fetch(`${base}/api/admin/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}
