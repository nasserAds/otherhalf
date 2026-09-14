'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { getStoredCredentials } from '@/store/authStore';
import { useAuthStore } from '@/store/authStore';

export default function SplashPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const stored = getStoredCredentials();
      if (!stored) {
        router.replace('/login');
        return;
      }
      try {
        const { accessToken, user } = await api.login(stored.username, stored.deviceSecret);
        setSession(user, accessToken);
        router.replace('/menu');
      } catch {
        router.replace('/login');
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [router, setSession]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-6">
      <div className="relative w-[140px] h-[140px] rounded-full border-[3px] border-mint flex items-center justify-center animate-breathe">
        <span className="absolute inset-[-3px] rounded-full border-[3px] border-transparent border-t-amber border-l-amber animate-spin_slow" />
        <span className="text-mint font-black text-[42px]">ج</span>
      </div>
      <span className="text-mint font-black text-[30px]">جدال</span>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0], opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-amber' : i === 2 ? 'bg-mint' : 'bg-fg-600'}`}
          />
        ))}
      </div>
    </div>
  );
}
