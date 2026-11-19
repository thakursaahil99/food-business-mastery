import "server-only";
import { cookies } from "next/headers";

/**
 * Backend-for-frontend client. The Sanctum token lives in an httpOnly cookie and is only
 * ever attached server-side, so client JS can't read it.
 *
 * Set API_URL (e.g. http://localhost:8000/api/v1) to talk to Laravel; leave it unset to
 * run the portal on mock data.
 */
export const API_URL = process.env.API_URL?.replace(/\/$/, "") || null;
export const isMock = !API_URL;
export const SESSION_COOKIE = "rb_session";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export async function getToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  if (!API_URL) throw new Error("apiFetch called in mock mode");
  const { auth = true, headers, ...rest } = init;
  const token = auth ? await getToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    throw new ApiError(body.message ?? `Request failed (${res.status})`, res.status, body.errors);
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json()) as { data?: T } & T;
  // Laravel API Resources wrap payloads in { data }
  return (json.data ?? json) as T;
}
