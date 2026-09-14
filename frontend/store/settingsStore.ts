import { create } from 'zustand';

interface SettingsState {
  musicVolume: number; // 0–100. Wired for a future music track; no track shipped yet.
  fxVolume: number; // 0–100. Drives lib/sound.ts's synthesized effects.
  setMusicVolume: (v: number) => void;
  setFxVolume: (v: number) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'otherhalf_settings';
const LEGACY_STORAGE_KEY = 'jadal_settings';

function load(): { musicVolume: number; fxVolume: number } {
  if (typeof window === 'undefined') return { musicVolume: 70, fxVolume: 85 };
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return { musicVolume: 70, fxVolume: 85 };
    return JSON.parse(raw);
  } catch {
    return { musicVolume: 70, fxVolume: 85 };
  }
}

function persist(state: { musicVolume: number; fxVolume: number }) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  musicVolume: 70,
  fxVolume: 85,

  setMusicVolume: (v) => {
    set({ musicVolume: v });
    persist({ musicVolume: v, fxVolume: get().fxVolume });
  },
  setFxVolume: (v) => {
    set({ fxVolume: v });
    persist({ musicVolume: get().musicVolume, fxVolume: v });
  },

  hydrate: () => set(load()),
}));
