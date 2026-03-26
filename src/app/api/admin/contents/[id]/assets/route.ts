import { getTokenOrUnauthorized, backendFetch } from "@/lib/backend";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { token, error } = await getTokenOrUnauthorized();
  if (error) return error;

  const { id } = await params;
  const form = await req.formData();

  return backendFetch(`/api/admin/contents/${id}/assets`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form as any,
  });
}
