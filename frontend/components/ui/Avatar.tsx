import { memo } from 'react';
import clsx from 'clsx';
import Image from 'next/image';
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
          'relative rounded-full flex items-center justify-center border-2 bg-gradient-to-br flex-none transition-transform overflow-hidden',
          SIZE_MAP[size],
          avatarGradient(avatar),
          highlighted ? (ringColor === 'mint' ? 'border-mint shadow-mint' : 'border-amber shadow-amber') : 'border-line-800',
          speaking && ringColor === 'mint' && 'border-mint shadow-mint animate-speakPulse',
          onClick && 'cursor-pointer hover:-translate-y-1',
        )}
      >
        <Image
          src={profile.image}
          alt=""
          fill
          sizes={size === 'sm' ? '40px' : size === 'md' ? '56px' : size === 'lg' ? '84px' : '110px'}
          className="object-cover"
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
