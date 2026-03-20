import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(req: Request) {
  const body = await req.json();

  const backendRes = await backendFetch("/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (backendRes.status !== 200) return backendRes;

  const data = await backendRes.json();
  const token = data?.accessToken;
  if (!token) return NextResponse.json({ error: "missing accessToken" }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return res;
}
