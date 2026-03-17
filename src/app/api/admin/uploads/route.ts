import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();

  const r = await fetch("http://localhost:8080/api/admin/uploads/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // multipart는 Content-Type 직접 세팅 ❌
    },
    body: form as any,
  });

  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}
