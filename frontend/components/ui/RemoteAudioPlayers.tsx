'use client';

import { useEffect, useRef } from 'react';

// Audio playback is intentionally independent from microphone capture. Browsers
// may block remote audio until the user taps the listen button, so this
// component retries playback whenever listening is enabled or a new peer arrives.
export function RemoteAudioPlayers({
  streams,
  audioEnabled,
  mutedUsers,
}: {
  streams: Record<string, MediaStream>;
  audioEnabled: boolean;
  mutedUsers: Record<string, boolean>;
}) {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([userId, audio]) => {
      audio.muted = Boolean(mutedUsers[userId]);
      if (audioEnabled) audio.play().catch(() => undefined);
    });
  }, [audioEnabled, mutedUsers, streams]);

  return (
    <>
      {Object.entries(streams).map(([userId, stream]) => (
        <audio
          key={userId}
          autoPlay
          playsInline
          aria-hidden="true"
          ref={(el) => {
            if (!el) {
              delete audioRefs.current[userId];
              return;
            }
            audioRefs.current[userId] = el;
            el.muted = Boolean(mutedUsers[userId]);
            if (el.srcObject !== stream) el.srcObject = stream;
            if (audioEnabled) el.play().catch(() => undefined);
          }}
        />
      ))}
    </>
  );
}
