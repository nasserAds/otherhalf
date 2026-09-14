'use client';

// Every sound here is synthesized at runtime with the Web Audio API rather
// than loaded from an audio file — no licensing questions, no asset
// pipeline, and it's a handful of KB of code instead of megabytes of audio.
// A real music track can be layered in later (see settingsStore's
// musicVolume, which is wired but currently silent — no track shipped).

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  // Browsers suspend AudioContext until a user gesture — every call site
  // here happens inside a click/interaction handler, so this resolves
  // immediately in practice.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine', delay = 0) {
  const audioCtx = getContext();
  if (!audioCtx || volume <= 0) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const startAt = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

export function createSoundEngine(getFxVolume: () => number) {
  const vol = () => Math.max(0, Math.min(1, getFxVolume())) * 0.2; // keep synthesized tones from ever being harsh

  return {
    click: () => tone(520, 0.06, vol() * 0.6, 'sine'),
    toggleOn: () => tone(660, 0.09, vol(), 'sine'),
    toggleOff: () => tone(420, 0.09, vol(), 'sine'),
    success: () => {
      tone(523, 0.12, vol(), 'sine');
      tone(784, 0.16, vol(), 'sine', 0.08);
    },
    error: () => tone(220, 0.18, vol(), 'square'),
    notification: () => tone(880, 0.08, vol() * 0.7, 'triangle'),
    tick: () => tone(1000, 0.04, vol() * 0.5, 'square'),
    win: () => {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, vol(), 'sine', i * 0.09));
    },
  };
}

export type SoundEngine = ReturnType<typeof createSoundEngine>;
