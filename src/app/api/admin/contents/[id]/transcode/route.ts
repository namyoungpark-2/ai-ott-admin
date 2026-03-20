import { authedBackendFetch } from "@/lib/backend";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return authedBackendFetch(`/api/admin/contents/${id}/transcode`, {
    method: "POST",
  });
}
