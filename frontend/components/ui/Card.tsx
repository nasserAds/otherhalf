import { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={clsx('bg-ink-900 border-2 border-[#29263a] rounded-[9px] p-[18px] shadow-[3px_4px_0_rgba(41,38,58,0.92)]', className)} {...rest}>
      {children}
    </div>
  );
}
