import { memo } from 'react';
import clsx from 'clsx';
import { Avatar as AvatarType } from '@/types';
import { avatarGradient, avatarProfile } from '@/lib/avatars';

const SIZE_MAP = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-[84px] h-[84px]',
  xl: 'w-[110px] h-[110px]',
};

interface AvatarProps {
  avatar: AvatarType;
  size?: keyof typeof SIZE_MAP;
  crown?: boolean;
  online?: boolean;
  selected?: boolean;
  glow?: boolean;
  speaking?: boolean;
  micOn?: boolean;
  ringColor?: 'mint' | 'amber';
  onClick?: () => void;
}

export const AvatarBadge = memo(function AvatarBadge({
  avatar,
  size = 'md',
  crown,
  online,
  selected,
  glow,
  speaking,
  micOn,
  ringColor = 'mint',
  onClick,
}: AvatarProps) {
  const highlighted = selected || glow;
  const profile = avatarProfile(avatar);

  return (
    <div className="relative inline-flex" onClick={onClick}>
      <div
        className={clsx(
          'rounded-full flex items-center justify-center border-2 bg-gradient-to-br flex-none transition-transform overflow-hidden',
          SIZE_MAP[size],
          avatarGradient(avatar),
          highlighted ? (ringColor === 'mint' ? 'border-mint shadow-mint' : 'border-amber shadow-amber') : 'border-line-800',
          speaking && ringColor === 'mint' && 'border-mint shadow-mint animate-speakPulse',
          onClick && 'cursor-pointer hover:-translate-y-1',
        )}
      >
        <CharacterPortrait
          skin={profile.skin}
          hair={profile.hair}
          accent={profile.accent}
          compact={size === 'sm'}
        />
      </div>
      {crown && (
        <span className="absolute -top-2 -left-1 w-[22px] h-[22px] rounded-full bg-amber text-[#35260A] flex items-center justify-center shadow-amber">
          <CrownIcon />
        </span>
      )}
      {online !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 -left-0 w-3.5 h-3.5 rounded-full border-[3px] border-ink-900',
            online ? 'bg-mint' : 'bg-fg-600',
          )}
        />
      )}
      {micOn && (
        <span className="absolute bottom-0 -right-0 w-5 h-5 rounded-full bg-mint text-white flex items-center justify-center border-2 border-ink-900">
          <MicIcon />
        </span>
      )}
      {selected && (
        <span className="absolute -bottom-1.5 -left-1.5 w-6 h-6 rounded-full bg-mint text-white text-xs font-black flex items-center justify-center border-2 border-ink-900">
          ✓
        </span>
      )}
    </div>
  );
});

function CharacterPortrait({
  skin,
  hair,
  accent,
  compact,
}: {
  skin: string;
  hair: string;
  accent: string;
  compact: boolean;
}) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
      <circle cx="60" cy="63" r="48" fill="rgba(255,255,255,0.42)" />
      <path d="M25 112c5-22 18-35 35-35s30 13 35 35H25z" fill={accent} />
      <path d="M35 49c0-22 12-35 26-35 17 0 28 13 28 35v20H35V49z" fill={hair} />
      <circle cx="60" cy="55" r="29" fill={skin} />
      <path d="M31 51c4-23 18-35 35-35 12 6 20 16 23 31-17-3-29-9-37-19-4 10-11 18-21 23z" fill={hair} />
      <circle cx="49" cy="58" r={compact ? 3.2 : 3.7} fill="#172033" />
      <circle cx="71" cy="58" r={compact ? 3.2 : 3.7} fill="#172033" />
      <path d="M52 73c5 4 11 4 16 0" fill="none" stroke="#172033" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 86c8 8 37 8 45 0 6 5 10 13 12 26H25c3-13 7-21 13-26z" fill={accent} />
      <path d="M45 87c8 5 22 5 30 0" fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 4 5-7 5 7 4-4-2 10H5L3 8z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
    </svg>
  );
}
