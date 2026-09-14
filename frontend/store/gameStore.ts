import { create } from 'zustand';
import { MatchDebater, MatchPhase, TopicCandidate, WinnerAnnouncedPayload } from '@/types';

interface ReactionEvent {
  emoji: string;
  userId: string;
  ts: number;
}

interface TopicVoteState {
  candidates: TopicCandidate[];
  durationSeconds: number;
  remainingSeconds: number;
  debaterA: { userId: string; username: string };
  debaterB: { userId: string; username: string };
  counts: Record<string, number>;
  myChoice: string | null;
}

interface GameState {
  matchId: string | null;
  topic: string | null;
  debaterA: MatchDebater | null;
  debaterB: MatchDebater | null;
  phase: MatchPhase | null;
  durationSeconds: number;
  remainingSeconds: number;
  speakerId: string | null;
  result: WinnerAnnouncedPayload | null;
  turns: Record<string, string>; // speakerId -> latest submitted text
  lastReaction: ReactionEvent | null;
  myVoteAccepted: boolean;
  myPredictionAccepted: boolean;
  topicVote: TopicVoteState | null;

  startTopicVote: (payload: {
    candidates: TopicCandidate[];
    durationSeconds: number;
    debaterA: { userId: string; username: string };
    debaterB: { userId: string; username: string };
  }) => void;
  updateTopicVoteCounts: (counts: Record<string, number>) => void;
  tickTopicVote: (remaining: number) => void;
  setMyTopicVoteChoice: (topicId: string) => void;

  startMatch: (payload: {
    matchId: string;
    topic: string;
    debaterA: MatchDebater;
    debaterB: MatchDebater;
  }) => void;
  setPhase: (phase: MatchPhase, durationSeconds: number, speakerId?: string) => void;
  tick: (remaining: number) => void;
  recordTurn: (speakerId: string, content: string) => void;
  addReaction: (reaction: ReactionEvent) => void;
  setVoteAccepted: (accepted: boolean) => void;
  setPredictionAccepted: (accepted: boolean) => void;
  setResult: (result: WinnerAnnouncedPayload) => void;
  reset: () => void;
}

const initial = {
  matchId: null,
  topic: null,
  debaterA: null,
  debaterB: null,
  phase: null,
  durationSeconds: 0,
  remainingSeconds: 0,
  speakerId: null,
  result: null,
  turns: {},
  lastReaction: null,
  myVoteAccepted: false,
  myPredictionAccepted: false,
  topicVote: null,
} as const;

export const useGameStore = create<GameState>((set) => ({
  ...initial,

  startTopicVote: ({ candidates, durationSeconds, debaterA, debaterB }) =>
    set({
      ...initial, // a new topic vote means any previous match's leftovers (result, etc.) are stale
      topicVote: {
        candidates,
        durationSeconds,
        remainingSeconds: durationSeconds,
        debaterA,
        debaterB,
        counts: Object.fromEntries(candidates.map((c) => [c.topicId, 0])),
        myChoice: null,
      },
    }),

  updateTopicVoteCounts: (counts) =>
    set((state) => (state.topicVote ? { topicVote: { ...state.topicVote, counts } } : {})),

  tickTopicVote: (remaining) =>
    set((state) => (state.topicVote ? { topicVote: { ...state.topicVote, remainingSeconds: remaining } } : {})),

  setMyTopicVoteChoice: (topicId) =>
    set((state) => (state.topicVote ? { topicVote: { ...state.topicVote, myChoice: topicId } } : {})),

  startMatch: ({ matchId, topic, debaterA, debaterB }) =>
    set({ ...initial, matchId, topic, debaterA, debaterB }),

  setPhase: (phase, durationSeconds, speakerId) =>
    set({
      phase,
      durationSeconds,
      remainingSeconds: durationSeconds,
      speakerId: speakerId ?? null,
      myVoteAccepted: false,
    }),

  tick: (remaining) => set({ remainingSeconds: remaining }),

  recordTurn: (speakerId, content) =>
    set((state) => ({ turns: { ...state.turns, [speakerId]: content } })),

  addReaction: (reaction) => set({ lastReaction: reaction }),

  setVoteAccepted: (accepted) => set({ myVoteAccepted: accepted }),
  setPredictionAccepted: (accepted) => set({ myPredictionAccepted: accepted }),

  setResult: (result) => set({ result, phase: 'COMPLETED' }),

  reset: () => set({ ...initial }),
}));
