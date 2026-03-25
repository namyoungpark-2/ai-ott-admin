import { authedBackendFetch } from "@/lib/backend";

export async function GET() {
  return authedBackendFetch("/api/ops/transcoding/summary");
}
