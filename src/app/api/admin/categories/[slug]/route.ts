import { NextRequest } from "next/server";
import { authedBackendFetch } from "@/lib/backend";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await req.text();
  return authedBackendFetch(`/api/admin/categories/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return authedBackendFetch(`/api/admin/categories/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}
