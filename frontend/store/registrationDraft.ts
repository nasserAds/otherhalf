import { create } from 'zustand';

const STORAGE_KEY = 'otherhalf_registration_username';

interface RegistrationDraftState {
  username: string;
  hydrate: () => void;
  setUsername: (username: string) => void;
  clear: () => void;
}

export const useRegistrationDraft = create<RegistrationDraftState>((set) => ({
  username: '',
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const username = window.sessionStorage.getItem(STORAGE_KEY);
    if (username) set({ username });
  },
  setUsername: (username) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, username);
    }
    set({ username });
  },
  clear: () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    set({ username: '' });
  },
}));
