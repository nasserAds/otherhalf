import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  hydrate: () => void;
  setSession: (user: User, accessToken: string, deviceSecret?: string) => void;
  updateSession: (user: User, accessToken: string) => void;
  logout: () => void;
}

// localStorage is fine here — this is real app code, not a Claude Artifacts
// preview sandbox (which disallows browser storage).
const STORAGE_KEYS = {
  username: 'otherhalf_username',
  deviceSecret: 'otherhalf_device_secret',
};
const LEGACY_STORAGE_KEYS = {
  username: 'jadal_username',
  deviceSecret: 'jadal_device_secret',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  hydrate: () => {
    // Called on app boot; real silent-login (calling /auth/login with the
    // stored deviceSecret) is wired up in the login/splash screens — this
    // just exposes what's persisted so those screens can act on it.
  },

  setSession: (user, accessToken, deviceSecret) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.username, user.username);
      if (deviceSecret) {
        window.localStorage.setItem(STORAGE_KEYS.deviceSecret, deviceSecret);
      }
    }
    set({ user, accessToken });
  },

  updateSession: (user, accessToken) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.username, user.username);
    }
    set({ user, accessToken });
  },

  // IMPORTANT: logout only clears the in-memory session. It must NOT touch
  // the stored username/deviceSecret — that pair is the only credential
  // that can ever re-authenticate this account on this device (there's no
  // password). Wiping it on logout would permanently lock the user out of
  // their own account from this device.
  logout: () => {
    set({ user: null, accessToken: null });
  },
}));

export function getStoredCredentials(): { username: string; deviceSecret: string } | null {
  if (typeof window === 'undefined') return null;
  const username =
    window.localStorage.getItem(STORAGE_KEYS.username) ??
    window.localStorage.getItem(LEGACY_STORAGE_KEYS.username);
  const deviceSecret =
    window.localStorage.getItem(STORAGE_KEYS.deviceSecret) ??
    window.localStorage.getItem(LEGACY_STORAGE_KEYS.deviceSecret);
  if (!username || !deviceSecret) return null;
  window.localStorage.setItem(STORAGE_KEYS.username, username);
  window.localStorage.setItem(STORAGE_KEYS.deviceSecret, deviceSecret);
  return { username, deviceSecret };
}
