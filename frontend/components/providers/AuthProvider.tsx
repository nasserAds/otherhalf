'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { getStoredCredentials, useAuthStore } from '@/store/authStore';

const MANUAL_LOGOUT_KEY = 'otherhalf_manual_logout';
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (typeof window === 'undefined') return;

      if (window.sessionStorage.getItem(MANUAL_LOGOUT_KEY) === '1') {
        if (!cancelled) setReady(true);
        return;
      }

      const stored = getStoredCredentials();
      if (!stored) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const { accessToken, user } = await api.login(stored.username, stored.deviceSecret);
        if (!cancelled) setSession(user, accessToken);
      } catch (error) {
        // A bad stored credential means the account was deleted or its
        // device credential is no longer valid. Network errors should not
        // destroy the only persistent credential.
        if (error instanceof ApiError && error.status === 401) {
          window.localStorage.removeItem('otherhalf_username');
          window.localStorage.removeItem('otherhalf_device_secret');
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [setSession]);

  useEffect(() => {
    if (!ready || !user) return;

    async function refreshSession() {
      if (refreshInFlight.current) return refreshInFlight.current;

      const stored = getStoredCredentials();
      if (!stored) return;

      const promise = api
        .login(stored.username, stored.deviceSecret)
        .then(({ accessToken, user }) => {
          setSession(user, accessToken);
        })
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401 && typeof window !== 'undefined') {
            window.localStorage.removeItem('otherhalf_username');
            window.localStorage.removeItem('otherhalf_device_secret');
          }
        })
        .finally(() => {
          refreshInFlight.current = null;
        });

      refreshInFlight.current = promise;
      return promise;
    }

    const interval = window.setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [ready, user, setSession]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm font-bold text-fg-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-mint" />
          جارِ استعادة الحساب...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
