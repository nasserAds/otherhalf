'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { ConnectionBanner } from '@/components/ui/ConnectionBanner';
import { MicButton } from '@/components/ui/MicButton';
import { RemoteAudioPlayers } from '@/components/ui/RemoteAudioPlayers';
import { Spinner } from '@/components/ui/Spinner';
import { PlayerList } from '@/components/lobby/PlayerList';
import { ChatPanel } from '@/components/lobby/ChatPanel';
import { HostSettingsPanel } from '@/components/lobby/HostSettingsPanel';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { useGameStore } from '@/store/gameStore';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useVoiceChatContext } from '@/components/providers/VoiceChatProvider';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/components/ui/Toast';

export default function LobbyPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const room = useRoomStore((s) => s.room);
  const chat = useRoomStore((s) => s.chat);
  const matchId = useGameStore((s) => s.matchId);
  const { show } = useToast();
  const sound = useSound();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { toggleReady, sendChat, startMatch, leaveRoom, kickPlayer, updateSettings } = useRoomSocket(params.code);
  useGameSocket(); // populates useGameStore as soon as game:matchStarted arrives
  const {
    micOn,
    micError,
    micStates,
    remoteStreams,
    audioEnabled,
    mutedUsers,
    toggleRemoteMute,
    toggleMic,
  } = useVoiceChatContext();

  const me = room?.players.find((p) => p.userId === user?.id);
  const isHost = me?.role === 'HOST';
  const isReady = me?.isReady ?? false;
  const voiceEnabled = room?.debateMode === 'VOICE' || room?.debateMode === 'TEXT_VOICE';

  // A match starting is what actually moves everyone into the Game screen —
  // driven by the server broadcasting game:matchStarted, not a client-side
  // navigation the host triggers directly.
  useEffect(() => {
    if (matchId) router.push(`/room/${params.code}/game`);
  }, [matchId, params.code, router]);

  function handleReadyToggle() {
    const next = !isReady;
    next ? sound.toggleOn() : sound.toggleOff();
    toggleReady(next);
  }

  function handleStart() {
    if (!room || room.players.filter((p) => p.isOnline).length < 2) {
      sound.error();
      show('يلزم لاعبان متصلان على الأقل لبدء الجولة');
      return;
    }
    sound.success();
    startMatch();
  }

  function handleCopyCode() {
    navigator.clipboard?.writeText(room!.code);
    sound.notification();
    show('تم نسخ الكود ✓');
  }

  function handleMicToggle() {
    sound.click();
    toggleMic();
  }

  // Explicitly tells the server we're leaving (host transfer / room cleanup
  // happens immediately) instead of just navigating away client-side and
  // relying on the ~30s disconnect grace period to eventually notice.
  function handleBack() {
    leaveRoom();
    router.push('/games/otherhalf');
  }

  function handleKick(userId: string) {
    sound.click();
    kickPlayer(userId);
  }

  if (!room) {
    return (
      <PageTransition>
        <div className="flex-1 flex items-center justify-center">
          <Spinner label="جارِ الاتصال بالغرفة..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <RemoteAudioPlayers streams={remoteStreams} audioEnabled={audioEnabled} mutedUsers={mutedUsers} />
      <ConnectionBanner />
      <div className="flex items-center justify-between mb-5">
        <button onClick={handleBack} className="text-fg-100" aria-label="مغادرة الغرفة">
          <BackIcon />
        </button>
        <button onClick={handleCopyCode} className="flex items-center gap-2" aria-label={`نسخ كود الغرفة ${room.code}`}>
          <span className="text-xl font-black tracking-[4px] text-amber ltr-nums">{room.code}</span>
          <CopyIcon />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-fg-500 ltr-nums" aria-label={`${room.players.length} من ${room.maxPlayers} لاعبين`}>
            {room.players.length}/{room.maxPlayers}
          </span>
          {isHost && (
            <button onClick={() => setSettingsOpen(true)} aria-label="إعدادات الغرفة" className="text-fg-500 hover:text-fg-100">
              <GearIcon />
            </button>
          )}
        </div>
      </div>

      <PlayerList
        players={room.players}
        micStates={micStates}
        myUserId={user?.id}
        mutedUsers={mutedUsers}
        onToggleMute={toggleRemoteMute}
        canKick={isHost}
        onKick={handleKick}
      />

      {voiceEnabled && (
        <div className="self-center mb-3 flex flex-col items-center gap-2">
          <MicButton active={micOn} onClick={handleMicToggle} />
          {micError && <p className="max-w-[280px] text-center text-xs font-bold text-amber">{micError}</p>}
        </div>
      )}

      <div className="mt-auto mb-3">
        <div className="flex items-baseline gap-2 mb-1.5 px-0.5">
          <span className="text-xs font-extrabold text-fg-100">الدردشة</span>
          {voiceEnabled && <span className="text-[10px] text-fg-600">يمكنك الكتابة والتحدث بالميكروفون في آنٍ واحد</span>}
        </div>
        <ChatPanel messages={chat} onSend={sendChat} />
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={handleReadyToggle} aria-pressed={isReady}>
          {isReady ? 'إلغاء الجاهزية' : 'جاهز'}
        </Button>
        {isHost && <Button onClick={handleStart}>بدء (المضيف)</Button>}
      </div>

      {isHost && (
        <HostSettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentMaxPlayers={room.maxPlayers}
          currentPlayerCount={room.players.length}
          currentDebateMode={room.debateMode}
          currentVisibility={room.visibility}
          onSave={(patch) => {
            sound.success();
            updateSettings(patch);
          }}
        />
      )}

      {/* Screen-reader announcement for host transfer / readiness changes handled via toast; this live region covers state not otherwise voiced. */}
      <span className="sr-only" role="status" aria-live="polite">
        {isReady ? 'أنت جاهز الآن' : ''}
      </span>
    </PageTransition>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="12 19 5 12 12 5" />
      <line x1="19" y1="12" x2="5" y2="12" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
