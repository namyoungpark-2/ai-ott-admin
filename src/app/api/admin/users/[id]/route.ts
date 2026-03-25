import { authedBackendFetch } from "@/lib/backend";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return authedBackendFetch(`/api/admin/users/${id}`, { method: "DELETE" });
}
