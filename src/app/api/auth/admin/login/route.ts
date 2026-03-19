import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const r = await fetch(`${base}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await r.text();
  if (!r.ok) return new NextResponse(text, { status: r.status });

  const data = JSON.parse(text);
  const token = data?.accessToken;
  if (!token) return new NextResponse("missing accessToken", { status: 500 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return res;
}
