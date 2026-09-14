'use client';

import clsx from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={clsx(
        'relative w-[46px] h-[26px] rounded-pill flex-none transition-colors',
        checked ? 'bg-mint' : 'bg-ink-700',
        disabled && 'pointer-events-none opacity-70',
      )}
    >
      <span
        className={clsx(
          'absolute top-[3px] w-5 h-5 rounded-full transition-all',
          checked ? 'right-[23px] bg-white' : 'right-[3px] bg-fg-500',
        )}
      />
    </button>
  );
}
