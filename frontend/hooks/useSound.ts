'use client';

import { useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { createSoundEngine } from '@/lib/sound';

export function useSound() {
  const fxVolume = useSettingsStore((s) => s.fxVolume);
  // Recreated only when volume changes — getFxVolume closes over a live
  // read via the store's getState so playback always reflects the current
  // value even if this memo hasn't rebuilt yet.
  return useMemo(() => createSoundEngine(() => useSettingsStore.getState().fxVolume / 100), [fxVolume]);
}
