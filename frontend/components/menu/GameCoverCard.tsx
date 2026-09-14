'use client';

import { motion } from 'framer-motion';
import { AvatarBadge } from '@/components/ui/Avatar';
import { GameMeta } from '@/lib/games';

interface GameCoverCardProps {
  game: GameMeta;
  onPlay: () => void;
}

export function GameCoverCard({ game, onPlay }: GameCoverCardProps) {
  return (
    <motion.button
      onClick={onPlay}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full rounded-lg overflow-hidden border border-line-800 bg-ink-900 text-right shadow-[0_16px_45px_rgba(66,86,73,0.10)]"
    >
      <div className="relative h-[120px] flex items-center justify-center overflow-hidden">
        {game.comingSoon ? <ComingSoonArt /> : <JadalCoverArt />}
      </div>

      <div className="p-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-extrabold text-base">{game.title}</h3>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-pill ${
                game.comingSoon ? 'bg-ink-800 text-fg-600 border border-line-800' : 'bg-mint/10 text-mint'
              }`}
            >
              {game.comingSoon ? 'قريبًا' : 'متاح الآن'}
            </span>
          </div>
          <p className="text-xs text-fg-500">{game.tagline}</p>
          {game.players && <p className="text-[11px] text-fg-600 mt-1">{game.players}</p>}
        </div>
        {!game.comingSoon && (
          <span className="w-11 h-11 rounded-full bg-mint text-white flex items-center justify-center flex-none shadow-mint">
            <PlayIcon />
          </span>
        )}
      </div>
    </motion.button>
  );
}

function JadalCoverArt() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#E3F8E9] via-[#FFFFFF] to-[#FFF0C9] flex items-center justify-center gap-0">
      <AvatarBadge avatar="LION" size="lg" glow />
      <div className="w-9 h-9 rounded-lg bg-amber text-[#35260A] font-black text-[11px] flex items-center justify-center -mx-1 rotate-45 shadow-amber z-10">
        <span className="-rotate-45">VS</span>
      </div>
      <AvatarBadge avatar="TIGER" size="lg" ringColor="amber" glow />
    </div>
  );
}

function ComingSoonArt() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-white flex items-center justify-center">
      <span className="w-12 h-12 rounded-full border border-line-800 bg-white/80 flex items-center justify-center text-fg-600">
        <LockIcon />
      </span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
