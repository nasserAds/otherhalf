'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { AvatarBadge } from '@/components/ui/Avatar';
import { GameCoverCard } from '@/components/menu/GameCoverCard';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { GAMES } from '@/lib/games';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function GamesHubPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { show } = useToast();

  return (
    <PageTransition>
      <div className="flex items-center gap-2.5 bg-ink-900 border border-line-800 rounded-pill py-2 pl-3.5 pr-2 mb-6">
        {user && <AvatarBadge avatar={user.avatar} size="sm" />}
        <div className="flex flex-col gap-0.5">
          <strong className="text-[13px]">{user?.username ?? '...'}</strong>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-mint">
              <BoltIcon /> {user?.xp ?? 0}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber">
              <CoinIcon /> {user?.coins ?? 0}
            </span>
          </div>
        </div>
        <Link href={user ? `/profile/${encodeURIComponent(user.username)}` : '/settings'} className="mr-auto text-fg-500 hover:text-fg-100" aria-label="الملف الشخصي">
          <GearIcon />
        </Link>
      </div>

      <h1 className="text-xl font-extrabold mb-1">اختر لعبة</h1>
      <p className="text-sm text-fg-500 mb-5">منصة ألعاب جماعية — المزيد قريبًا</p>

      <motion.div variants={listVariants} initial="hidden" animate="show" className="flex flex-col gap-3.5">
        {GAMES.map((game) => (
          <motion.div key={game.slug} variants={itemVariants}>
            <GameCoverCard
              game={game}
              onPlay={() => {
                if (game.comingSoon) {
                  show('هذه اللعبة قريبًا 👀');
                  return;
                }
                router.push(`/games/${game.slug}`);
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </PageTransition>
  );
}

function iconProps() {
  return { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
}
function GearIcon() { return <svg {...iconProps()}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>; }
function BoltIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 11 14 11 22 21 10 13 10 13 2" /></svg>; }
function CoinIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1 3 2.3-1 1.9-3 2.4-3 1.1-3 2.4 1.3 2.4 3 2.4 3-1 3-2.4" /></svg>; }
