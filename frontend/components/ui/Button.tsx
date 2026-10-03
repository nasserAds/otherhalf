'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost';
  size?: 'md' | 'sm';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'btn-press w-full flex items-center justify-center gap-2 rounded-[7px] font-cairo font-bold',
        size === 'md' ? 'px-5 py-[17px] text-base' : 'px-4 py-[10px] text-sm',
        variant === 'primary' && 'border-2 border-[#29263a] bg-mint text-white shadow-[2px_3px_0_#29263a] hover:bg-[#5D8E75] hover:-translate-y-px',
        variant === 'accent' && 'border-2 border-[#29263a] bg-amber text-[#35260A] shadow-[2px_3px_0_#29263a] hover:bg-[#E8BB69] hover:-translate-y-px',
        variant === 'ghost' && 'border-2 border-[#29263a] bg-ink-900 text-fg-100 shadow-[2px_3px_0_rgba(41,38,58,0.92)] hover:bg-ink-800 hover:-translate-y-px',
        rest.disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
