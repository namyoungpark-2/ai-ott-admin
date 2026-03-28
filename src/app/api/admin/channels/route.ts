import { authedBackendFetch } from "@/lib/backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ?? "50";
  return authedBackendFetch(`/api/admin/channels?limit=${encodeURIComponent(limit)}`);
}
