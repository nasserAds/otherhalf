'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/ui/PageTransition';
import { AvatarBadge } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/types';

type Profile = Awaited<ReturnType<typeof api.getPlayerProfile>>;

export default function PlayerProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken || !params.username) return;
    api.getPlayerProfile(accessToken, params.username)
      .then(setProfile)
      .catch((err) => {
        setError(err instanceof ApiError && err.status === 404
          ? 'هذا الملف غير موجود أو خاص.'
          : 'تعذر تحميل الملف الشخصي.');
      });
  }, [accessToken, params.username]);

  if (error) {
    return <PageTransition><div className="py-16 text-center"><h1 className="text-xl font-black">{error}</h1><Button variant="ghost" className="mt-5" onClick={() => router.back()}>رجوع</Button></div></PageTransition>;
  }

  if (!profile) return <PageTransition><div className="py-16 text-center text-sm text-fg-500">جاري تحميل الملف...</div></PageTransition>;

  return (
    <PageTransition>
      <div className="mb-5 flex items-center gap-3">
        <Link href="/menu" className="text-fg-100" aria-label="العودة">←</Link>
        <h1 className="text-xl font-extrabold">الملف الشخصي</h1>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line-800 bg-ink-900">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <AvatarBadge avatar={profile.avatar as Avatar} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black">{profile.username}</h2>
              <p className="mt-1 text-sm text-fg-500">Level {profile.level} · {profile.xp.toLocaleString('en-US')} XP</p>
            </div>
            {currentUser?.username === profile.username && (
              <Link href="/settings" className="sm:mr-auto"><Button variant="ghost">الإعدادات</Button></Link>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Wins" value={profile.wins} />
            <Stat label="Losses" value={profile.losses} />
            <Stat label="Win Rate" value={`${profile.winRate}%`} />
            <Stat label="Debates" value={profile.totalDebates} />
            <Stat label="Votes Received" value={profile.votesReceived} />
            <Stat label="Win Streak" value={profile.currentWinStreak} />
            <Stat label="Longest Streak" value={profile.longestWinStreak} />
            <Stat label="XP" value={profile.xp.toLocaleString('en-US')} />
          </div>
        </div>

        <div className="border-t border-line-800 p-5 sm:p-7">
          <h3 className="mb-4 font-black">Match History</h3>
          <div className="space-y-2">
            {profile.matchHistory.map((match) => (
              <div key={match.id} className="flex items-center gap-3 rounded-xl border border-line-800 bg-bg-900 p-3">
                <span className={`w-16 shrink-0 text-center text-xs font-black ${match.result === 'WIN' ? 'text-mint' : match.result === 'LOSS' ? 'text-danger' : 'text-amber'}`}>
                  {match.result === 'WIN' ? 'WIN' : match.result === 'LOSS' ? 'LOSS' : 'DRAW'}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{match.topic}</span>
                <span className="hidden text-xs text-fg-500 sm:block">{match.endedAt ? new Date(match.endedAt).toLocaleDateString() : ''}</span>
              </div>
            ))}
            {profile.matchHistory.length === 0 && <p className="py-6 text-center text-sm text-fg-500">لا توجد مباريات مكتملة بعد.</p>}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-line-800 bg-bg-900 p-3"><div className="text-[11px] font-bold text-fg-500">{label}</div><div className="mt-1 text-xl font-black text-mint">{value}</div></div>;
}
