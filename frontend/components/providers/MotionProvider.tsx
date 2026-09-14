'use client';

import { MotionConfig } from 'framer-motion';
import { ReactNode } from 'react';

// reducedMotion="user" makes every motion.* component in the app respect
// the OS-level "reduce motion" accessibility setting automatically —
// transforms/scale/slide animations collapse to instant or opacity-only,
// no per-component work required.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
