'use client';

import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { REACTION_EMOJIS } from '@/lib/constants';

export function TopicCard({ topic }: { topic: string }) {
  return (
    <Card className="text-center">
      <div className="text-xs font-bold text-fg-500 mb-1.5">موضوع المناظرة</div>
      <h2 className="text-[19px] leading-relaxed font-extrabold">{topic}</h2>
    </Card>
  );
}

export function ReactionBar({ onReact }: { onReact?: (emoji: string) => void }) {
  return (
    <div className="flex justify-center gap-2.5 mt-auto pt-4">
      {REACTION_EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.08, y: -3 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => onReact?.(emoji)}
          className="w-[46px] h-[46px] rounded-full bg-ink-800 border border-line-800 text-xl"
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
