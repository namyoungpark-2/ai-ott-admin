import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const base = "http://localhost:8080";
  const url = `${base}/api/admin/failures`;
  
  console.log(`[API] Requesting ${url} with token: ${token ? `${token.substring(0, 20)}...` : 'none'}`);
  
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await r.text();
    
    // 디버깅: 백엔드 응답 로깅
    console.log(`[API] Backend response: ${r.status} ${r.statusText}`);
    if (!r.ok) {
      console.error(`[API] Backend returned ${r.status} for /api/admin/failures:`, text);
    }
    
    return new NextResponse(text, { status: r.status });
  } catch (error) {
    console.error("[API] Failed to fetch from backend:", error);
    return NextResponse.json(
      { error: "Backend server unavailable", details: error instanceof Error ? error.message : String(error) },
      { status: 503 }
    );
  }
}
