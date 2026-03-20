import { authedBackendFetch } from "@/lib/backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const url = new URL("/api/admin/video-assets", "http://dummy");
  if (status) url.searchParams.set("status", status);

  return authedBackendFetch(`${url.pathname}${url.search}`);
}
