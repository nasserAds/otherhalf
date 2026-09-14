'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { getSocket } from '@/lib/socket';
import { SocketEvents } from '@/lib/socketEvents';
import { MatchStartedPayload, PhaseChangedPayload, TopicVoteStartedPayload, WinnerAnnouncedPayload } from '@/types';

export function useGameSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const startTopicVote = useGameStore((s) => s.startTopicVote);
  const updateTopicVoteCounts = useGameStore((s) => s.updateTopicVoteCounts);
  const tickTopicVote = useGameStore((s) => s.tickTopicVote);
  const startMatch = useGameStore((s) => s.startMatch);
  const setPhase = useGameStore((s) => s.setPhase);
  const tick = useGameStore((s) => s.tick);
  const recordTurn = useGameStore((s) => s.recordTurn);
  const addReaction = useGameStore((s) => s.addReaction);
  const setVoteAccepted = useGameStore((s) => s.setVoteAccepted);
  const setPredictionAccepted = useGameStore((s) => s.setPredictionAccepted);
  const setResult = useGameStore((s) => s.setResult);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const onTopicVoteStarted = (payload: TopicVoteStartedPayload) => startTopicVote(payload);
    const onTopicVoteUpdate = ({ counts }: { counts: Record<string, number> }) => updateTopicVoteCounts(counts);
    const onTopicVoteTick = ({ remaining }: { remaining: number }) => tickTopicVote(remaining);
    const onMatchStarted = (payload: MatchStartedPayload) => startMatch(payload);
    const onPhaseChanged = (payload: PhaseChangedPayload) =>
      setPhase(payload.phase, payload.durationSeconds, payload.speakerId);
    const onTimerTick = ({ remaining }: { matchId: string; remaining: number }) => tick(remaining);
    const onTurnSubmitted = ({ speakerId, content }: { matchId: string; speakerId: string; content: string }) =>
      recordTurn(speakerId, content);
    const onReact = ({ emoji, userId }: { matchId: string; emoji: string; userId: string }) =>
      addReaction({ emoji, userId, ts: Date.now() });
    const onVoteAck = () => setVoteAccepted(true);
    const onPredictAck = () => setPredictionAccepted(true);
    const onResult = (payload: WinnerAnnouncedPayload) => setResult(payload);

    socket.on(SocketEvents.GAME_TOPIC_VOTE_STARTED, onTopicVoteStarted);
    socket.on(SocketEvents.GAME_TOPIC_VOTE_UPDATE, onTopicVoteUpdate);
    socket.on(SocketEvents.GAME_TOPIC_VOTE_TICK, onTopicVoteTick);
    socket.on(SocketEvents.GAME_MATCH_STARTED, onMatchStarted);
    socket.on(SocketEvents.GAME_PHASE_CHANGED, onPhaseChanged);
    socket.on(SocketEvents.GAME_TIMER_TICK, onTimerTick);
    socket.on(SocketEvents.GAME_TURN_SUBMITTED, onTurnSubmitted);
    socket.on(SocketEvents.AUDIENCE_REACT, onReact);
    socket.on(SocketEvents.VOTING_CAST_VOTE, onVoteAck);
    socket.on(SocketEvents.AUDIENCE_PREDICT, onPredictAck);
    socket.on(SocketEvents.RESULTS_WINNER_ANNOUNCED, onResult);

    return () => {
      socket.off(SocketEvents.GAME_TOPIC_VOTE_STARTED, onTopicVoteStarted);
      socket.off(SocketEvents.GAME_TOPIC_VOTE_UPDATE, onTopicVoteUpdate);
      socket.off(SocketEvents.GAME_TOPIC_VOTE_TICK, onTopicVoteTick);
      socket.off(SocketEvents.GAME_MATCH_STARTED, onMatchStarted);
      socket.off(SocketEvents.GAME_PHASE_CHANGED, onPhaseChanged);
      socket.off(SocketEvents.GAME_TIMER_TICK, onTimerTick);
      socket.off(SocketEvents.GAME_TURN_SUBMITTED, onTurnSubmitted);
      socket.off(SocketEvents.AUDIENCE_REACT, onReact);
      socket.off(SocketEvents.VOTING_CAST_VOTE, onVoteAck);
      socket.off(SocketEvents.AUDIENCE_PREDICT, onPredictAck);
      socket.off(SocketEvents.RESULTS_WINNER_ANNOUNCED, onResult);
    };
  }, [
    accessToken,
    startTopicVote,
    updateTopicVoteCounts,
    tickTopicVote,
    startMatch,
    setPhase,
    tick,
    recordTurn,
    addReaction,
    setVoteAccepted,
    setPredictionAccepted,
    setResult,
  ]);

  return {
    castTopicVote(topicId: string) {
      if (!accessToken) return;
      getSocket(accessToken).emit(SocketEvents.GAME_TOPIC_VOTE_CAST, { topicId });
    },
    submitTurn(matchId: string, content: string) {
      if (!accessToken) return;
      getSocket(accessToken).emit(SocketEvents.GAME_TURN_SUBMITTED, { matchId, content });
    },
    castVote(matchId: string, votedForId: string) {
      if (!accessToken) return;
      getSocket(accessToken).emit(SocketEvents.VOTING_CAST_VOTE, { matchId, votedForId });
    },
    castPrediction(matchId: string, predictedWinnerId: string) {
      if (!accessToken) return;
      getSocket(accessToken).emit(SocketEvents.AUDIENCE_PREDICT, { matchId, predictedWinnerId });
    },
    react(matchId: string, emoji: string) {
      if (!accessToken) return;
      getSocket(accessToken).emit(SocketEvents.AUDIENCE_REACT, { matchId, emoji });
    },
  };
}
