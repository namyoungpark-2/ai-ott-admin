import { NextRequest } from "next/server";
import { authedBackendFetch } from "@/lib/backend";

export async function GET() {
  return authedBackendFetch("/api/admin/categories");
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  return authedBackendFetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
