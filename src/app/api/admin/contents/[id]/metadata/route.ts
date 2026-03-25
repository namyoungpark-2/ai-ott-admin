import { authedBackendFetch } from "@/lib/backend";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.text();
  return authedBackendFetch(`/api/admin/contents/${id}/metadata`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
