'use client';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function Stepper({ value, min, max, onChange }: StepperProps) {
  return (
    <div className="flex items-center gap-2 bg-ink-800 border border-line-800 rounded-pill p-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-[38px] h-[38px] rounded-full bg-ink-900 text-fg-100 font-black text-lg hover:bg-mint hover:text-white transition-colors"
      >
        −
      </button>
      <span className="w-8 text-center font-black text-base ltr-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-[38px] h-[38px] rounded-full bg-ink-900 text-fg-100 font-black text-lg hover:bg-mint hover:text-white transition-colors"
      >
        +
      </button>
    </div>
  );
}
