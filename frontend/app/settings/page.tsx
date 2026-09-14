'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSound } from '@/hooks/useSound';

export default function SettingsPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { musicVolume, fxVolume, setMusicVolume, setFxVolume, hydrate } = useSettingsStore();
  const sound = useSound();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <PageTransition>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/menu" className="text-fg-100" aria-label="العودة">
          <BackIcon />
        </Link>
        <h1 className="text-xl font-extrabold">الإعدادات</h1>
      </div>

      <div className="divide-y divide-line-800">
        <div className="py-4">
          <div className="flex items-center justify-between">
            <label htmlFor="music-volume" className="font-bold text-sm">
              مستوى صوت الموسيقى
            </label>
            <span className="text-sm text-fg-500 ltr-nums" aria-hidden="true">
              {musicVolume}%
            </span>
          </div>
          <input
            id="music-volume"
            type="range"
            min={0}
            max={100}
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            aria-valuetext={`${musicVolume}%`}
            className="w-full mt-2.5 accent-mint"
          />
        </div>
        <div className="py-4">
          <div className="flex items-center justify-between">
            <label htmlFor="fx-volume" className="font-bold text-sm">
              مستوى صوت المؤثرات
            </label>
            <span className="text-sm text-fg-500 ltr-nums" aria-hidden="true">
              {fxVolume}%
            </span>
          </div>
          <input
            id="fx-volume"
            type="range"
            min={0}
            max={100}
            value={fxVolume}
            onChange={(e) => setFxVolume(Number(e.target.value))}
            onMouseUp={() => sound.notification()}
            onTouchEnd={() => sound.notification()}
            aria-valuetext={`${fxVolume}%`}
            className="w-full mt-2.5 accent-mint"
          />
        </div>
        <div className="py-4 flex items-center justify-between">
          <span className="font-bold text-sm">الوضع الداكن</span>
          <Switch checked disabled />
          <span className="sr-only" role="status">مفعّل دائمًا</span>
        </div>
      </div>

      <Button variant="ghost" onClick={handleLogout} className="mt-auto text-danger border-danger/30">
        تسجيل خروج
      </Button>
    </PageTransition>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="12 19 5 12 12 5" />
      <line x1="19" y1="12" x2="5" y2="12" />
    </svg>
  );
}
