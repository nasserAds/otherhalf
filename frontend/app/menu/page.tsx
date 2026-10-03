'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { AvatarBadge } from '@/components/ui/Avatar';
import { GameCoverCard } from '@/components/menu/GameCoverCard';
import { useAuthStore } from '@/store/authStore';
import { GAMES } from '@/lib/games';

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function GamesHubPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <PageTransition>
      <div className="relative mb-6 flex items-center gap-2.5 rounded-pill border border-line-800 bg-ink-900 py-2 pl-3.5 pr-2">
        <button type="button" onClick={() => setProfileOpen((value) => !value)} aria-label="فتح الملف الشخصي" aria-expanded={profileOpen} className="rounded-full">
          {user && <AvatarBadge avatar={user.avatar} size="sm" />}
        </button>
        <div className="flex flex-col gap-0.5">
          <strong className="text-[13px]">{user?.username ?? '...'}</strong>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-mint"><BoltIcon /> {user?.xp ?? 0}</span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber"><CoinIcon /> {user?.coins ?? 0}</span>
          </div>
        </div>
        <div className="mr-auto flex items-center gap-1">
          <Link href="/settings" className="rounded-full p-2 text-fg-500 hover:bg-bg-900 hover:text-fg-100" aria-label="الإعدادات"><GearIcon /></Link>
          <Link href="/about" className="rounded-full p-2 text-fg-500 hover:bg-bg-900 hover:text-fg-100" aria-label="من نحن"><InfoIcon /></Link>
        </div>

        <AnimatePresence>
          {profileOpen && user && (
            <motion.div initial={{ opacity: 0, y: -5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.98 }} className="absolute right-0 top-[58px] z-20 w-[250px] rounded-2xl border border-line-800 bg-ink-900 p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <AvatarBadge avatar={user.avatar} size="md" />
                <div className="min-w-0">
                  <div className="truncate font-black">{user.username}</div>
                  <div className="text-xs text-fg-500">Level {user.level} · {user.xp} XP</div>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <Link onClick={() => setProfileOpen(false)} href={`/profile/${encodeURIComponent(user.username)}`} className="rounded-xl bg-mint px-3 py-2.5 text-center text-xs font-black text-ink-950">عرض الملف الشخصي</Link>
                <Link onClick={() => setProfileOpen(false)} href="/settings" className="rounded-xl border border-line-800 bg-bg-900 px-3 py-2.5 text-center text-xs font-bold">الإعدادات</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <h1 className="text-xl font-extrabold mb-1">اختر لعبة</h1>
      <p className="text-sm text-fg-500 mb-5">مجتمع OtherHalf — ألعاب متعددة، والمناظرات مجرد البداية</p>

      <motion.div variants={listVariants} initial="hidden" animate="show" className="flex flex-col gap-3.5">
        {GAMES.filter((game) => !game.comingSoon).map((game) => (
          <motion.div key={game.slug} variants={itemVariants}>
            <GameCoverCard game={game} onPlay={() => router.push(`/games/${game.slug}`)} />
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-6 rounded-2xl border border-line-800 bg-ink-900 p-5 text-center">
        <div className="text-lg">✦</div>
        <h2 className="mt-1 font-black">ألعاب أكثر قادمة</h2>
        <p className="mt-1 text-xs leading-5 text-fg-500">OtherHalf منصة متعددة الألعاب. سنضيف ألعابًا جديدة للمجتمع مع الوقت.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link href="/settings" className="rounded-xl border border-line-800 bg-ink-900 px-3 py-3 text-center text-xs font-bold">⚙ الإعدادات</Link>
        <Link href="/about" className="rounded-xl border border-line-800 bg-ink-900 px-3 py-3 text-center text-xs font-bold">ⓘ من نحن</Link>
      </div>
    </PageTransition>
  );
}

function iconProps() { return { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }; }
function GearIcon() { return <svg {...iconProps()}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a2 2 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>; }
function InfoIcon() { return <svg {...iconProps()}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>; }
function BoltIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 11 14 11 22 21 10 13 10 13 2" /></svg>; }
function CoinIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1 3 2.3-1 1.9-3 2.4-3 1.1-3 2.4 1.3 2.4 3 2.4 3-1 3-2.4" /></svg>; }
