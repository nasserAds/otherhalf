import { memo } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { RoomPlayer } from '@/types';
import { AvatarBadge } from '../ui/Avatar';

interface PlayerListProps {
  players: RoomPlayer[];
  micStates?: Record<string, boolean>;
  myUserId?: string;
  mutedUsers?: Record<string, boolean>;
  onToggleMute?: (userId: string) => void;
  canKick?: boolean; // true when the viewer is host
  onKick?: (userId: string) => void;
}

export function PlayerList({ players, micStates, myUserId, mutedUsers, onToggleMute, canKick, onKick }: PlayerListProps) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      {players.map((p) => (
        <PlayerRow
          key={p.userId}
          player={p}
          micOn={micStates?.[p.userId]}
          isMuted={mutedUsers?.[p.userId]}
          showMute={Boolean(onToggleMute) && p.userId !== myUserId}
          onToggleMute={onToggleMute}
          showKick={Boolean(canKick) && p.role !== 'HOST'}
          onKick={onKick}
        />
      ))}
    </div>
  );
}

const PlayerRow = memo(function PlayerRow({
  player,
  micOn,
  isMuted,
  showMute,
  onToggleMute,
  showKick,
  onKick,
}: {
  player: RoomPlayer;
  micOn?: boolean;
  isMuted?: boolean;
  showMute: boolean;
  onToggleMute?: (userId: string) => void;
  showKick: boolean;
  onKick?: (userId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1.5 rounded-md hover:bg-ink-800 transition-colors">
      <AvatarBadge
        avatar={player.user.avatar}
        size="sm"
        crown={player.role === 'HOST'}
        online={player.isOnline}
        micOn={micOn}
      />
      <span className="font-bold text-sm">{player.user.username}</span>
      <motion.span
        key={String(player.isReady)}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className={clsx(
          'text-[11px] font-extrabold px-2.5 py-1 rounded-pill',
          showKick ? 'mr-2' : 'mr-auto',
          player.isReady ? 'bg-mint/15 text-mint' : 'bg-ink-800 text-fg-600 border border-line-800',
        )}
      >
        {player.isReady ? 'جاهز' : 'بالانتظار'}
      </motion.span>
      {showMute && (
        <button
          onClick={() => onToggleMute?.(player.userId)}
          aria-pressed={isMuted}
          aria-label={isMuted ? `إلغاء كتم صوت ${player.user.username}` : `كتم صوت ${player.user.username}`}
          title={isMuted ? 'إلغاء كتم الصوت' : 'كتم صوت اللاعب'}
          className={clsx(
            'mr-auto w-7 h-7 rounded-full flex items-center justify-center transition-colors',
            isMuted ? 'text-amber bg-amber/10' : 'text-fg-600 hover:text-fg-100 hover:bg-ink-700',
          )}
        >
          <SpeakerIcon muted={Boolean(isMuted)} />
        </button>
      )}
      {showKick && (
        <button
          onClick={() => onKick?.(player.userId)}
          aria-label={`إخراج ${player.user.username} من الغرفة`}
          className="w-7 h-7 rounded-full flex items-center justify-center text-fg-600 hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <KickIcon />
        </button>
      )}
    </div>
  );
});

function KickIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {muted ? (
        <>
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 5a10 10 0 0 1 0 14" />
        </>
      )}
    </svg>
  );
}
