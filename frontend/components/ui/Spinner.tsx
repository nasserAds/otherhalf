'use client';

import { motion } from 'framer-motion';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6" role="status" aria-live="polite">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 rounded-full border-[3px] border-line-800 border-t-mint"
      />
      {label && <span className="text-xs text-fg-500">{label}</span>}
    </div>
  );
}
