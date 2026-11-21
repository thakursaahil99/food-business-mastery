import { useCallback, useEffect, useRef, useState } from 'react';

import { api, ApiError } from './api';
import { useAuth } from './auth';

/** Loads one GET endpoint with the signed-in token. `reload` powers pull to refresh. Pass null to skip. */
export function useApi<T>(path: string | null) {
  const { session, signOut } = useAuth();
  const token = session?.token ?? null;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!token || path === null) return;
    setError(null);
    try {
      const res = await api<T>(path, { token });
      if (alive.current) setData(res);
    } catch (e) {
      if (!alive.current) return;
      // A revoked or expired token: back to the login screen.
      if (e instanceof ApiError && e.status === 401) {
        void signOut();
        return;
      }
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path, token, signOut]);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { data, setData, error, loading, reload: load };
}

/** Send a write request with the signed-in token. */
export function useWrite() {
  const { session } = useAuth();
  return useCallback(<T,>(path: string, method: 'POST' | 'PUT', body?: unknown) => api<T>(path, { method, token: session?.token, body: body === undefined ? undefined : JSON.stringify(body) }), [session?.token]);
}
