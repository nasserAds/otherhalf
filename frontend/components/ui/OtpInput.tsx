'use client';

import { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(length, ' ').split('').slice(0, length);

  function setChar(index: number, char: string) {
    const next = chars.slice();
    next[index] = char.toUpperCase();
    onChange(next.join('').trimEnd());
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !chars[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          maxLength={1}
          value={chars[i].trim()}
          onChange={(e) => setChar(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-[42px] h-[52px] text-center text-xl font-black bg-ink-800 border border-line-800 rounded-sm text-fg-100 focus:outline-none focus:border-mint focus:shadow-mint"
        />
      ))}
    </div>
  );
}
