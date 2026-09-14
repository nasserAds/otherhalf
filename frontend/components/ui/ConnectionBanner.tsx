'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useConnectionStore } from '@/store/connectionStore';

export function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);
  if (status === 'connected') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="self-center mb-3 flex items-center gap-2 bg-ink-800 border border-amber/40 text-amber text-xs font-bold px-3.5 py-1.5 rounded-pill"
      >
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-amber"
        />
        {status === 'reconnecting' ? 'جارِ إعادة الاتصال...' : 'الاتصال منقطع'}
      </motion.div>
    </AnimatePresence>
  );
}
