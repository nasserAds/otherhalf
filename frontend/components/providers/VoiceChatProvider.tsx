'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useVoiceChat } from '@/hooks/useVoiceChat';

type VoiceChatValue = ReturnType<typeof useVoiceChat>;

const VoiceChatContext = createContext<VoiceChatValue | null>(null);

export function VoiceChatProvider({ children }: { children: ReactNode }) {
  const voice = useVoiceChat();
  return <VoiceChatContext.Provider value={voice}>{children}</VoiceChatContext.Provider>;
}

export function useVoiceChatContext(): VoiceChatValue {
  const ctx = useContext(VoiceChatContext);
  if (!ctx) throw new Error('useVoiceChatContext must be used within VoiceChatProvider');
  return ctx;
}
