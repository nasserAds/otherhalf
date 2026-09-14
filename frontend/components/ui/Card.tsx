import { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={clsx('bg-ink-900/90 border border-line-800 rounded-lg p-[18px] shadow-[0_14px_40px_rgba(66,86,73,0.08)]', className)} {...rest}>
      {children}
    </div>
  );
}
