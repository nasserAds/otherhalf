'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { useRegistrationDraft } from '@/store/registrationDraft';

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState<AvailabilityStatus>('idle');
  const router = useRouter();
  const draftUsername = useRegistrationDraft((s) => s.username);
  const hydrateDraft = useRegistrationDraft((s) => s.hydrate);
  const setDraftUsername = useRegistrationDraft((s) => s.setUsername);

  useEffect(() => {
    hydrateDraft();
  }, [hydrateDraft]);

  useEffect(() => {
    if (draftUsername) setUsername(draftUsername);
  }, [draftUsername]);

  const trimmedUsername = username.trim();
  const usernameValid = /^[\p{L}0-9_]{3,20}$/u.test(trimmedUsername);
  const showUsernameHint = trimmedUsername.length > 0 && !usernameValid;
  const canContinue = usernameValid && availability === 'available';

  useEffect(() => {
    if (!usernameValid) {
      setAvailability('idle');
      return;
    }

    let cancelled = false;
    setAvailability('checking');

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await api.checkUsername(trimmedUsername);
        if (!cancelled) {
          setAvailability(result.available ? 'available' : 'taken');
        }
      } catch (err) {
        if (!cancelled) {
          setAvailability(err instanceof ApiError && err.status === 409 ? 'taken' : 'error');
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [trimmedUsername, usernameValid]);

  function handleNext() {
    if (!canContinue) return;
    setDraftUsername(trimmedUsername);
    router.push('/avatar');
  }

  function availabilityMessage() {
    if (showUsernameHint) {
      return 'الاسم يجب أن يكون من 3 إلى 20 حرفًا، بدون مسافات أو رموز.';
    }
    if (availability === 'checking') return 'جاري التحقق من الاسم...';
    if (availability === 'available') return 'الاسم متاح.';
    if (availability === 'taken') return 'هذا الاسم مستخدم بالفعل. جرّب اسمًا آخر.';
    if (availability === 'error') return 'تعذر التحقق من الاسم الآن.';
    return '';
  }

  const usernameMessage = availabilityMessage();

  return (
    <PageTransition>
      <div className="flex-1 flex flex-col justify-center gap-7">
        <div className="text-center">
          <div className="w-16 h-16 rounded-md mx-auto mb-3.5 bg-gradient-to-br from-mint to-mint-dim flex items-center justify-center text-2xl font-black text-white shadow-mint">
            ج
          </div>
          <h1 className="text-2xl font-extrabold mb-1">حساب جديد</h1>
          <p className="text-sm text-fg-500">اختر اسمًا يظهر للاعبين الآخرين</p>
        </div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          placeholder="اسم المستخدم"
          className="w-full bg-ink-800 border border-line-800 rounded-md px-[18px] py-4 text-base font-semibold text-center focus:outline-none focus:border-mint focus:shadow-mint"
        />
        {usernameMessage && (
          <p
            className={[
              'min-h-4 text-center text-xs font-bold',
              availability === 'available' ? 'text-mint' : 'text-amber',
            ].join(' ')}
          >
            {usernameMessage}
          </p>
        )}
      </div>
      <Button onClick={handleNext} disabled={!canContinue}>
        التالي
      </Button>
    </PageTransition>
  );
}
