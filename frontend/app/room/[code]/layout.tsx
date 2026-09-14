import { VoiceChatProvider } from '@/components/providers/VoiceChatProvider';

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <VoiceChatProvider>{children}</VoiceChatProvider>;
}
