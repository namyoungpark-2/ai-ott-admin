import { NextRequest } from "next/server";
import { authedBackendFetch } from "@/lib/backend";

export async function GET() {
  return authedBackendFetch("/api/admin/genres");
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  return authedBackendFetch("/api/admin/genres", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
