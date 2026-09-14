'use client';

// Renders one hidden <audio> element per connected voice peer. Audio
// elements need `srcObject` set imperatively (it's not a valid JSX/HTML
// attribute), hence the ref callback below rather than a prop. The explicit
// .play() call is a safety net — turning the mic on is itself a user
// gesture, which satisfies autoplay-with-sound policies in practice, but
// some browsers still need a nudge for elements created after that gesture.
export function RemoteAudioPlayers({ streams }: { streams: Record<string, MediaStream> }) {
  return (
    <>
      {Object.entries(streams).map(([userId, stream]) => (
        <audio
          key={userId}
          autoPlay
          playsInline
          ref={(el) => {
            if (!el || el.srcObject === stream) return;
            el.srcObject = stream;
            el.play().catch(() => undefined);
          }}
        />
      ))}
    </>
  );
}
