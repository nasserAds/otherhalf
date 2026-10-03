'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { AvatarBadge } from '@/components/ui/Avatar';
import { AVATARS } from '@/lib/avatars';
import { Avatar } from '@/types';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRegistrationDraft } from '@/store/registrationDraft';
import { useToast } from '@/components/ui/Toast';
import { useSound } from '@/hooks/useSound';

export default function AvatarSelectionPage() {
  const [selected, setSelected] = useState<Avatar>('LION');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const username = useRegistrationDraft((s) => s.username);
  const hydrateDraft = useRegistrationDraft((s) => s.hydrate);
  const clearDraft = useRegistrationDraft((s) => s.clear);
  const setSession = useAuthStore((s) => s.setSession);
  const { show } = useToast();
  const sound = useSound();

  useEffect(() => {
    hydrateDraft();
  }, [hydrateDraft]);

  async function handleContinue() {
    if (!username) {
      router.replace('/register');
      return;
    }
    setLoading(true);
    try {
      const { accessToken, deviceSecret, user } = await api.register(username, selected);
      setSession(user, accessToken, deviceSecret);
      clearDraft();
      sound.success();
      router.push('/menu');
    } catch (err) {
      sound.error();
      show(err instanceof ApiError ? err.message : 'تعذر إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="text-xs font-bold text-fg-500 mb-1.5">2 / 2</div>
      <h1 className="text-2xl font-extrabold mb-1">اختر أفاتارك</h1>
      <p className="text-sm text-fg-500">من مجموعتنا الجاهزة — بدون رفع صور</p>

      <div className="grid grid-cols-3 gap-3.5 my-5" role="radiogroup" aria-label="اختيار الأفاتار">
        {AVATARS.map((a) => (
          <button
            key={a.key}
            type="button"
            role="radio"
            aria-checked={selected === a.key}
            aria-label={a.name}
            onClick={() => {
              setSelected(a.key);
              sound.click();
            }}
            className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
          >
            <AvatarBadge avatar={a.key} size="lg" selected={selected === a.key} />
            <span className="text-sm font-bold text-fg-300">{a.name}</span>
          </button>
        ))}
      </div>

      <Button onClick={handleContinue} disabled={loading} className="mt-auto">
        متابعة
      </Button>
    </PageTransition>
  );
}
