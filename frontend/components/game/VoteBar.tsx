'use client';

import { motion } from 'framer-motion';

interface VoteBarProps {
  label: string;
  percent: number | null; // null = not revealed yet
  side: 'a' | 'b';
}

export function VoteBar({ label, percent, side }: VoteBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs font-bold">
        <span>{label}</span>
        <span className="ltr-nums">{percent === null ? '—' : `${percent}%`}</span>
      </div>
      <div className="h-3.5 bg-ink-800 rounded-pill overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent ?? 0}%` }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          className={`h-full rounded-pill ${side === 'a' ? 'bg-mint' : 'bg-amber'}`}
        />
      </div>
    </div>
  );
}
