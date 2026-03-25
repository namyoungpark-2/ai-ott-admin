import { NextRequest } from "next/server";
import { authedBackendFetch } from "@/lib/backend";

export async function GET() {
  return authedBackendFetch("/api/admin/contents");
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  return authedBackendFetch("/api/admin/contents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
