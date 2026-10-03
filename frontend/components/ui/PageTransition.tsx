'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  wide?: boolean;
}

export function PageTransition({ children, wide = false }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className={
        'flex min-h-[100dvh] w-full flex-col mx-auto px-5 pb-7 ' +
        (wide ? 'max-w-[1180px] px-3 pt-5 pb-8 sm:px-7 sm:pt-7 lg:px-10' : 'max-w-[440px] pt-9')
      }
    >
      {children}
    </motion.div>
  );
}
