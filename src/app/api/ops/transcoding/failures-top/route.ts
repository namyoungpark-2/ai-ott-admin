import { authedBackendFetch } from "@/lib/backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ?? "10";
  return authedBackendFetch(`/api/ops/transcoding/failures/top?limit=${limit}`);
}
