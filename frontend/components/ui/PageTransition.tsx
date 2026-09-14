'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-col min-h-[100dvh] w-full max-w-[440px] mx-auto px-5 pt-9 pb-7"
    >
      {children}
    </motion.div>
  );
}
