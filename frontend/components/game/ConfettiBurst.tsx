'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#22C55E', '#FACC15', '#4ADE80', '#FDE047'];

export function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        duration: 1.6 + Math.random() * 1.2,
        delay: Math.random() * 0.4,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{ y: 760, opacity: 0, rotate: 540 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
          style={{ left: `${p.left}%`, background: p.color }}
          className="absolute top-0 w-2 h-3.5"
        />
      ))}
    </div>
  );
}
