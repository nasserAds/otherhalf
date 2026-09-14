'use client';

import clsx from 'clsx';

interface TimerRingProps {
  remaining: number;
  total: number;
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({ remaining, total }: TimerRingProps) {
  const progress = total > 0 ? remaining / total : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const urgent = remaining <= 10;

  return (
    <div className="relative w-[74px] h-[74px] mx-auto mb-4">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#D6E4DD" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          stroke={urgent ? '#EF4444' : '#22C55E'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div className={clsx('absolute inset-0 flex items-center justify-center font-black text-xl ltr-nums', urgent && 'text-danger')}>
        {remaining}
      </div>
    </div>
  );
}
