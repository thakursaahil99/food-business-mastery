import { API_URL } from './config';

export type Role = 'student' | 'coach' | 'admin' | 'super_admin';

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  avatar: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

/** Thin fetch wrapper for the Laravel API. Unwraps Laravel's { data } envelope. */
export async function api<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your internet and try again.', 0);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };
    throw new ApiError(body.message ?? `Request failed (${res.status})`, res.status, body.errors);
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json()) as { data?: T } & T;
  return ('data' in json ? json.data : json) as T;
}

/** Email or Indian mobile number, mirroring the server normalisation. */
export function parseIdentifier(raw: string): { kind: 'email' | 'phone'; value: string } | null {
  const v = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { kind: 'email', value: v.toLowerCase() };
  const m = v.replace(/[\s\-()]/g, '').match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  return m ? { kind: 'phone', value: `+91${m[1]}` } : null;
}
