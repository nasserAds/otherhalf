'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PageTransition } from '@/components/ui/PageTransition';
import { getGame } from '@/lib/games';

export default function GameLandingPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const game = getGame(params.slug);

  useEffect(() => {
    if (params.slug === 'otherhalf') {
      router.replace('/games/debate-game');
      return;
    }
    if (!game || game.comingSoon) router.replace('/menu');
  }, [game, router]);

  if (!game || game.comingSoon) return null;

  // Only one real game exists right now — its menu is the existing
  // Create/Join Room screen. As more games are added, branch on
  // `params.slug` here to render each game's own landing content instead
  // of growing this file into a single giant switch.
  if (params.slug === 'debate-game') return <DebateGameMenu />;

  return null;
}

function DebateGameMenu() {
  return (
    <PageTransition>
      <div className="mb-8 flex items-center gap-3 rounded-[7px] border-b-2 border-[#29263a]/15 pb-4">
        <Link href="/menu" className="text-fg-100"><BackIcon /></Link>
        <div>
          <h1 className="text-xl font-extrabold leading-tight">Debate Game</h1>
          <p className="text-xs text-fg-500">مناظرات جماعية مباشرة</p>
        </div>
      </div>

      <div className="my-auto flex flex-col gap-4">
        <MenuButton href="/room/create" tone="g" title="إنشاء غرفة" subtitle="ابدأ غرفة جديدة وادعُ أصدقاءك" icon={<PlusIcon />} />
        <MenuButton href="/room/join" tone="a" title="الانضمام لغرفة" subtitle="أدخل الكود وابدأ اللعب" icon={<UsersIcon />} />
      </div>
    </PageTransition>
  );
}

function MenuButton({
  href,
  tone,
  title,
  subtitle,
  icon,
}: {
  href: string;
  tone: 'g' | 'a';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  const toneClass = tone === 'g' ? 'bg-mint/15 text-mint' : 'bg-amber/15 text-amber';
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 rounded-[9px] border-2 border-[#29263a] bg-ink-900 p-5 shadow-[3px_4px_0_#29263a] transition-all hover:-translate-y-1 hover:shadow-[5px_7px_0_#29263a]"
    >
      <div className={`w-[46px] h-[46px] rounded-md flex items-center justify-center flex-none ${toneClass}`}>{icon}</div>
      <div>
        <strong className="block text-base font-extrabold">{title}</strong>
        <span className="text-xs text-fg-500">{subtitle}</span>
      </div>
    </Link>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12 19 5 12 12 5" />
      <line x1="19" y1="12" x2="5" y2="12" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}
