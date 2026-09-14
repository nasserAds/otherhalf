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
        'btn-press w-full flex items-center justify-center gap-2 rounded-pill font-cairo font-bold',
        size === 'md' ? 'px-5 py-[17px] text-base' : 'px-4 py-[10px] text-sm',
        variant === 'primary' && 'bg-mint text-white shadow-mint hover:bg-[#12895A] hover:-translate-y-px',
        variant === 'accent' && 'bg-amber text-[#35260A] shadow-amber hover:bg-[#F8C75F] hover:-translate-y-px',
        variant === 'ghost' && 'bg-ink-900 text-fg-100 border border-line-800 hover:bg-ink-800',
        rest.disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
