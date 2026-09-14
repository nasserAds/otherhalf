'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { useAuthStore, getStoredCredentials } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const [username, setUsername] = useState(getStoredCredentials()?.username ?? '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { show } = useToast();

  async function handleLogin() {
    const stored = getStoredCredentials();
    if (!stored || stored.username !== username) {
      show('لا يوجد جهاز محفوظ بهذا الاسم — جرّب إنشاء حساب');
      return;
    }
    setLoading(true);
    try {
      const { accessToken, user } = await api.login(stored.username, stored.deviceSecret);
      setSession(user, accessToken);
      router.push('/menu');
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'تعذر تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex-1 flex flex-col justify-center gap-7">
        <div className="text-center">
          <div className="w-16 h-16 rounded-md mx-auto mb-3.5 bg-gradient-to-br from-mint to-mint-dim flex items-center justify-center text-2xl font-black text-white shadow-mint">
            O
          </div>
          <h1 className="text-2xl font-extrabold mb-1">تسجيل الدخول</h1>
          <p className="text-sm text-fg-500">أدخل اسمك وارجع للعبة فورًا</p>
        </div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="اسم المستخدم"
          className="w-full bg-ink-800 border border-line-800 rounded-md px-[18px] py-4 text-base font-semibold text-center focus:outline-none focus:border-mint focus:shadow-mint"
        />
      </div>
      <div className="flex flex-col gap-3">
        <Button onClick={handleLogin} disabled={loading || !username}>
          دخول
        </Button>
        <Link href="/register">
          <Button variant="ghost" size="sm">
            ليس لديك حساب؟ إنشاء حساب
          </Button>
        </Link>
      </div>
    </PageTransition>
  );
}
