'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSound } from '@/hooks/useSound';
import { api, ApiError } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const updateSession = useAuthStore((s) => s.updateSession);
  const logout = useAuthStore((s) => s.logout);
  const { musicVolume, fxVolume, setMusicVolume, setFxVolume, hydrate } = useSettingsStore();
  const sound = useSound();

  const [username, setUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user) setUsername(user.username);
  }, [user]);

  async function handleUsernameSave() {
    const nextUsername = username.trim();
    if (!accessToken || !user) return;

    if (nextUsername.length < 3 || nextUsername.length > 20 || !/^[\p{L}0-9_]+$/u.test(nextUsername)) {
      setUsernameMessage('الاسم يجب أن يكون بين 3 و20 حرفًا، ويمكن أن يحتوي على حروف وأرقام و _.');
      return;
    }

    if (nextUsername === user.username) {
      setUsernameMessage('هذا هو اسمك الحالي بالفعل.');
      return;
    }

    setSavingUsername(true);
    setUsernameMessage('');

    try {
      const result = await api.updateUsername(accessToken, nextUsername);
      updateSession(result.user, result.accessToken);
      sound.success();
      setUsernameMessage('تم تغيير الاسم بنجاح ✓');
    } catch (error) {
      sound.error();
      setUsernameMessage(
        error instanceof ApiError && error.status === 409
          ? 'هذا الاسم مستخدم بالفعل.'
          : 'تعذر تغيير الاسم الآن.',
      );
    } finally {
      setSavingUsername(false);
    }
  }

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
          <label htmlFor="username" className="font-bold text-sm">اسم المستخدم</label>
          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameMessage('');
              }}
              maxLength={20}
              dir="auto"
              className="min-w-0 w-full flex-1 rounded-xl border border-line-700 bg-bg-900 px-3 py-2.5 text-sm outline-none focus:border-mint sm:min-w-0"
              aria-describedby="username-message"
            />
            <Button
              onClick={handleUsernameSave}
              disabled={savingUsername}
              className="w-full shrink-0 sm:w-auto sm:min-w-[88px]"
            >
              {savingUsername ? 'حفظ...' : 'حفظ'}
            </Button>
          </div>
          {usernameMessage && (
            <p id="username-message" className="mt-2 text-xs font-bold text-fg-500">
              {usernameMessage}
            </p>
          )}
        </div>

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
