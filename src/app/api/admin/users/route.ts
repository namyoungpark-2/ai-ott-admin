import { authedBackendFetch } from "@/lib/backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier");
  const path = tier
    ? `/api/admin/users?tier=${encodeURIComponent(tier)}`
    : "/api/admin/users";
  return authedBackendFetch(path);
}
