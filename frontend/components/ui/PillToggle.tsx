'use client';

import clsx from 'clsx';

interface PillToggleProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function PillToggle<T extends string>({ options, value, onChange }: PillToggleProps<T>) {
  return (
    <div className="flex bg-ink-800 rounded-pill p-1 border border-line-800">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={clsx(
            'flex-1 py-[10px] px-2 rounded-pill font-cairo font-bold text-[13px] transition-colors',
            value === opt.value ? 'bg-mint text-white shadow-mint' : 'text-fg-500 hover:text-fg-100',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
