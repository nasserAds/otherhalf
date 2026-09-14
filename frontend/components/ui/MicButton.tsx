'use client';

import clsx from 'clsx';

interface MicButtonProps {
  active: boolean;
  onClick: () => void;
}

export function MicButton({ active, onClick }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'btn-press flex items-center gap-2 px-4 py-2.5 rounded-pill font-bold text-[13px] border transition-colors',
        active ? 'bg-mint text-white border-mint shadow-mint' : 'bg-ink-900 text-fg-500 border-line-800 hover:text-fg-100',
      )}
    >
      {active ? <MicOnIcon /> : <MicOffIcon />}
      {active ? 'الميكروفون مفتوح' : 'تفعيل الميكروفون'}
    </button>
  );
}

function MicOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
