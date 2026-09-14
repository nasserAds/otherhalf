import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#F7FAF6',
          900: '#FFFFFF',
          800: '#EEF5F1',
          700: '#E0ECE6',
        },
        line: { 800: '#D6E4DD' },
        mint: { DEFAULT: '#16A36A', dim: '#A7E8C7' },
        amber: { DEFAULT: '#F4B63D' },
        fg: { 100: '#172033', 500: '#637083', 600: '#8A96A8' },
        danger: { DEFAULT: '#DC3E4F' },
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
      },
      borderRadius: {
        sm: '12px',
        md: '20px',
        lg: '28px',
        pill: '999px',
      },
      boxShadow: {
        mint: '0 0 0 1px rgba(22,163,106,.22), 0 10px 28px rgba(22,163,106,.16)',
        amber: '0 0 0 1px rgba(244,182,61,.28), 0 10px 26px rgba(244,182,61,.18)',
      },
      keyframes: {
        breathe: {
          '0%,100%': { boxShadow: '0 0 34px rgba(22,163,106,.16)' },
          '50%': { boxShadow: '0 0 60px rgba(244,182,61,.24)' },
        },
        spin_slow: { to: { transform: 'rotate(360deg)' } },
        speakPulse: {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.045)' },
        },
        winnerFloat: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        breathe: 'breathe 2.6s ease-in-out infinite',
        spin_slow: 'spin_slow 2.2s linear infinite',
        speakPulse: 'speakPulse 1.4s ease-in-out infinite',
        winnerFloat: 'winnerFloat 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
