export function withApiBase(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  return `${base}${path}`;
}
