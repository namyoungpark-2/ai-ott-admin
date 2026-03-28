import { authedBackendFetch } from "@/lib/backend";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  return authedBackendFetch(
    `/api/admin/channels/${id}/status?status=${encodeURIComponent(status)}`,
    { method: "PATCH" },
  );
}
