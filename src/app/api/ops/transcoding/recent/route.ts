import { authedBackendFetch } from "@/lib/backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ?? "20";
  return authedBackendFetch(`/api/ops/transcoding/recent?limit=${limit}`);
}
