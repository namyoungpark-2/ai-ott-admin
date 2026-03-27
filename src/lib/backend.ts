import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/** 쿠키에서 토큰을 꺼내고, 없으면 401 NextResponse를 반환 */
export async function getTokenOrUnauthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value;
  if (!token) {
    return {
      token: null as never,
      error: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { token, error: null };
}

/** 백엔드 프록시 fetch — 연결 실패 시 502 반환 */
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const reqHeaders = await headers();
  const acceptLang = reqHeaders.get("accept-language") || "en";

  let r: Response;
  try {
    r = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Accept-Language": acceptLang,
        ...init?.headers,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 502 },
    );
  }

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("Content-Type") || "application/json" },
  });
}

/** 인증 + 백엔드 프록시를 한번에 처리 */
export async function authedBackendFetch(
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const { token, error } = await getTokenOrUnauthorized();
  if (error) return error;

  return backendFetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}
