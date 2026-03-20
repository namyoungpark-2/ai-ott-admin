import { authedBackendFetch } from "@/lib/backend";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return authedBackendFetch(`/api/admin/video-assets/${id}/transcode`, {
    method: "POST",
  });
}
