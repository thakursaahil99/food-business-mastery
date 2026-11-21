import { storage } from './storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError, type User } from './api';

const TOKEN_KEY = 'rb_token';

type Session = { token: string; user: User };
export type RegisterInfo = { name: string; email: string };

type AuthState = {
  /** false until the saved token has been checked */
  ready: boolean;
  session: Session | null;
  requestOtp: (identifier: string, register?: RegisterInfo) => Promise<void>;
  /** remember=false keeps the session in memory only, so the next app start asks to sign in again. */
  verifyOtp: (identifier: string, code: string, opts?: { register?: RegisterInfo; remember?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Restore a saved session; drop the token if the server no longer accepts it.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = await storage.get(TOKEN_KEY);
        if (token) {
          const user = await api<User>('/me', { token });
          if (alive) setSession({ token, user });
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) await storage.remove(TOKEN_KEY);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const requestOtp = useCallback(async (identifier: string, register?: RegisterInfo) => {
    await api(register ? '/auth/register/otp' : '/auth/otp/request', { method: 'POST', body: JSON.stringify({ identifier, ...register }) });
  }, []);

  const verifyOtp = useCallback(async (identifier: string, code: string, opts?: { register?: RegisterInfo; remember?: boolean }) => {
    const res = await api<Session>(opts?.register ? '/auth/register/verify' : '/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ identifier, code, device_name: 'mobile', ...opts?.register }),
    });
    if (opts?.remember === false) await storage.remove(TOKEN_KEY);
    else await storage.set(TOKEN_KEY, res.token);
    setSession(res);
  }, []);

  const signOut = useCallback(async () => {
    const token = session?.token;
    setSession(null);
    await storage.remove(TOKEN_KEY);
    if (token) await api('/auth/logout', { method: 'POST', token }).catch(() => undefined);
  }, [session]);

  const value = useMemo(() => ({ ready, session, requestOtp, verifyOtp, signOut }), [ready, session, requestOtp, verifyOtp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
