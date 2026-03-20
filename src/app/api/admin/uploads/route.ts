import { getTokenOrUnauthorized, backendFetch } from "@/lib/backend";

export async function POST(req: Request) {
  const { token, error } = await getTokenOrUnauthorized();
  if (error) return error;

  const form = await req.formData();

  return backendFetch("/api/admin/uploads/uploads", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form as any,
  });
}
