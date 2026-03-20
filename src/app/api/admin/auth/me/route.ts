import { authedBackendFetch } from "@/lib/backend";

export async function GET() {
  return authedBackendFetch("/api/admin/auth/me");
}
