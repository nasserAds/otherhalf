import { BadRequestException, Injectable } from '@nestjs/common';
import { MatchStatus, RoomStatus, RoundType } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { TopicsService } from '../topics/topics.service';
import { VotingService } from '../voting/voting.service';
import { XpService } from '../xp/xp.service';
import { SocketEvents } from '../common/socket-events';

// Round durations in seconds — see Phase 1 gameplay spec.
const DURATIONS = {
  PREPARING: 25,
  ROUND_1: 50,
  ROUND_2: 35,
  FINAL: 25,
  VOTING: 18,
} as const;

const TOPIC_VOTE_SECONDS = 12;
const TOPIC_CANDIDATE_COUNT = 3;

interface MatchStep {
  phase: MatchStatus;
  roundType: RoundType | null; // null for the VOTING step, which has no Round row
  duration: number;
  speakerId: string | null;
}

interface ActiveMatchState {
  roomId: string;
  currentRoundId: string | null;
  currentSpeakerId: string | null;
  phase: MatchStatus;
  durationSeconds: number;
  remainingSeconds: number;
}

interface DebaterInfo {
  userId: string;
  username: string;
}

interface PendingTopicVote {
  candidates: { topicId: string; text: string; stanceALabel: string; stanceBLabel: string }[];
  votes: Map<string, string>; // voterId -> topicId
  debaterA: DebaterInfo;
  debaterB: DebaterInfo;
  timer: NodeJS.Timeout;
  remaining: number;
}

@Injectable()
export class GameService {
  // matchId -> interval handle, so a match's timer can be found/cleared
  private timers = new Map<string, NodeJS.Timeout>();
  // matchId -> lightweight in-memory state for fast turn-submission lookups
  private activeMatches = new Map<string, ActiveMatchState>();
  // roomId -> the in-progress topic vote, if any (see castTopicVote below)
  private pendingTopicVotes = new Map<string, PendingTopicVote>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
    private readonly topicsService: TopicsService,
    private readonly votingService: VotingService,
    private readonly xpService: XpService,
  ) {}

  // Stage 1: pick the two debaters, draw a few candidate topics, and open a
  // short vote on which one gets used. The Match row itself isn't created
  // until the vote resolves (see resolveTopicVote) — nothing about this
  // stage touches the database beyond reading candidate topics, so there's
  // no schema change needed to support it.
  async startMatch(roomId: string, server: Server) {
    if (this.pendingTopicVotes.has(roomId)) {
      throw new BadRequestException('a topic vote is already in progress for this room');
    }

    const room = await this.roomsService.getRoomById(roomId);
    const eligible = room.players.filter((p) => p.isOnline);
    if (eligible.length < 2) {
      throw new BadRequestException('need at least 2 online players to start a match');
    }

    // Fisher-Yates shuffle, take the first two — also doubles as the
    // "who goes first" randomizer (see Phase 1 fairness note).
    const shuffled = [...eligible];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const [debaterAPlayer, debaterBPlayer] = shuffled;
    const debaterA: DebaterInfo = { userId: debaterAPlayer.userId, username: debaterAPlayer.user.username };
    const debaterB: DebaterInfo = { userId: debaterBPlayer.userId, username: debaterBPlayer.user.username };

    const usedTopicIds = (
      await this.prisma.match.findMany({ where: { roomId }, select: { topicId: true } })
    ).map((m) => m.topicId);
    const candidateTopics = await this.topicsService.getRandomTopics(TOPIC_CANDIDATE_COUNT, usedTopicIds);
    const candidates = candidateTopics.map((t) => ({
      topicId: t.id,
      text: t.text,
      stanceALabel: t.stanceALabel,
      stanceBLabel: t.stanceBLabel,
    }));

    const timer = setInterval(() => {
      const pending = this.pendingTopicVotes.get(roomId);
      if (!pending) {
        clearInterval(timer);
        return;
      }
      pending.remaining -= 1;
      server.to(roomId).emit(SocketEvents.GAME_TOPIC_VOTE_TICK, { remaining: pending.remaining });
      if (pending.remaining <= 0) {
        clearInterval(timer);
        this.resolveTopicVote(roomId, server).catch((err) =>
          console.error(`topic vote resolve failed for room ${roomId}:`, err),
        );
      }
    }, 1000);

    this.pendingTopicVotes.set(roomId, {
      candidates,
      votes: new Map(),
      debaterA,
      debaterB,
      timer,
      remaining: TOPIC_VOTE_SECONDS,
    });

    server.to(roomId).emit(SocketEvents.GAME_TOPIC_VOTE_STARTED, {
      candidates: candidates.map(({ topicId, text }) => ({ topicId, text })),
      durationSeconds: TOPIC_VOTE_SECONDS,
      debaterA,
      debaterB,
    });
  }

  // Anyone in the room (including the two debaters — they don't know which
  // stance they'll be assigned yet, so there's nothing to game here) can
  // vote once per topic-vote window; a resubmitted vote just overwrites
  // their previous pick.
  castTopicVote(roomId: string, userId: string, topicId: string, server: Server) {
    const pending = this.pendingTopicVotes.get(roomId);
    if (!pending) {
      throw new BadRequestException('no topic vote is currently open for this room');
    }
    if (!pending.candidates.some((c) => c.topicId === topicId)) {
      throw new BadRequestException('not a valid candidate topic');
    }
    pending.votes.set(userId, topicId);

    const counts: Record<string, number> = {};
    for (const c of pending.candidates) counts[c.topicId] = 0;
    for (const votedId of pending.votes.values()) counts[votedId] = (counts[votedId] ?? 0) + 1;

    server.to(roomId).emit(SocketEvents.GAME_TOPIC_VOTE_UPDATE, { counts });
  }

  private async resolveTopicVote(roomId: string, server: Server) {
    const pending = this.pendingTopicVotes.get(roomId);
    if (!pending) return;
    this.pendingTopicVotes.delete(roomId);

    const counts = new Map<string, number>();
    for (const c of pending.candidates) counts.set(c.topicId, 0);
    for (const votedId of pending.votes.values()) counts.set(votedId, (counts.get(votedId) ?? 0) + 1);

    const maxVotes = Math.max(...counts.values());
    const winners = pending.candidates.filter((c) => counts.get(c.topicId) === maxVotes);
    // Ties (including "nobody voted", where every count is 0) are broken
    // randomly rather than always favoring the first candidate.
    const winningTopic = winners[Math.floor(Math.random() * winners.length)];

    await this.beginMatch(roomId, server, pending.debaterA, pending.debaterB, winningTopic);
  }

  private async beginMatch(
    roomId: string,
    server: Server,
    debaterA: DebaterInfo,
    debaterB: DebaterInfo,
    topic: { topicId: string; text: string; stanceALabel: string; stanceBLabel: string },
  ) {
    const match = await this.prisma.match.create({
      data: {
        roomId,
        topicId: topic.topicId,
        debaterAId: debaterA.userId,
        debaterBId: debaterB.userId,
        status: MatchStatus.PREPARING,
      },
    });

    await this.roomsService.setRoomStatus(roomId, RoomStatus.IN_PROGRESS);
    this.activeMatches.set(match.id, {
      roomId,
      currentRoundId: null,
      currentSpeakerId: null,
      phase: MatchStatus.PREPARING,
      durationSeconds: DURATIONS.PREPARING,
      remainingSeconds: DURATIONS.PREPARING,
    });

    server.to(roomId).emit(SocketEvents.GAME_MATCH_STARTED, {
      matchId: match.id,
      topic: topic.text,
      debaterA: { userId: debaterA.userId, username: debaterA.username, stanceLabel: topic.stanceALabel },
      debaterB: { userId: debaterB.userId, username: debaterB.username, stanceLabel: topic.stanceBLabel },
    });

    const steps = this.buildSteps(debaterA.userId, debaterB.userId);
    this.runStep(match.id, roomId, server, steps, 0).catch((err) =>
      console.error(`match ${match.id} step failed:`, err),
    );

    return match;
  }

  // Text-mode turn submission. Voice-mode "turns" don't call this — see
  // Phase 1/6 notes on voice being a later, additive transport.
  async submitTurn(matchId: string, userId: string, content: string) {
    const state = this.activeMatches.get(matchId);
    if (!state || state.currentSpeakerId !== userId || !state.currentRoundId) {
      throw new BadRequestException('it is not your turn to speak right now');
    }
    return this.prisma.round.update({
      where: { id: state.currentRoundId },
      data: { content },
    });
  }

  private buildSteps(debaterAId: string, debaterBId: string): MatchStep[] {
    return [
      { phase: MatchStatus.PREPARING, roundType: RoundType.PREP, duration: DURATIONS.PREPARING, speakerId: null },
      { phase: MatchStatus.ROUND_1, roundType: RoundType.ROUND_1, duration: DURATIONS.ROUND_1, speakerId: debaterAId },
      { phase: MatchStatus.ROUND_1, roundType: RoundType.ROUND_1, duration: DURATIONS.ROUND_1, speakerId: debaterBId },
      { phase: MatchStatus.ROUND_2, roundType: RoundType.ROUND_2, duration: DURATIONS.ROUND_2, speakerId: debaterAId },
      { phase: MatchStatus.ROUND_2, roundType: RoundType.ROUND_2, duration: DURATIONS.ROUND_2, speakerId: debaterBId },
      { phase: MatchStatus.FINAL, roundType: RoundType.FINAL, duration: DURATIONS.FINAL, speakerId: debaterAId },
      { phase: MatchStatus.FINAL, roundType: RoundType.FINAL, duration: DURATIONS.FINAL, speakerId: debaterBId },
      { phase: MatchStatus.VOTING, roundType: null, duration: DURATIONS.VOTING, speakerId: null },
    ];
  }

  // Server-authoritative phase runner: creates the Round row (if any) for
  // this step, ticks a per-second countdown to every client in the room,
  // then recurses into the next step — or resolves the match once the
  // VOTING step's clock runs out. Kept as one interval-per-active-match
  // rather than a shared scheduler; fine at this scale, called out in
  // Phase 8 notes as a spot to revisit (e.g. a Redis-backed job queue) if
  // concurrent match volume grows.
  private async runStep(matchId: string, roomId: string, server: Server, steps: MatchStep[], index: number) {
    if (index >= steps.length) {
      await this.finishMatch(matchId, roomId, server);
      return;
    }
    const step = steps[index];

    await this.prisma.match.update({ where: { id: matchId }, data: { status: step.phase } });

    let roundId: string | null = null;
    if (step.roundType) {
      const round = await this.prisma.round.create({
        data: {
          matchId,
          type: step.roundType,
          speakerId: step.speakerId,
          durationSeconds: step.duration,
        },
      });
      roundId = round.id;
    }
    this.activeMatches.set(matchId, {
      roomId,
      currentRoundId: roundId,
      currentSpeakerId: step.speakerId,
      phase: step.phase,
      durationSeconds: step.duration,
      remainingSeconds: step.duration,
    });

    server.to(roomId).emit(SocketEvents.GAME_PHASE_CHANGED, {
      matchId,
      phase: step.phase,
      durationSeconds: step.duration,
      speakerId: step.speakerId ?? undefined,
    });

    let remaining = step.duration;
    const interval = setInterval(() => {
      remaining -= 1;
      const current = this.activeMatches.get(matchId);
      if (current) {
        current.remainingSeconds = remaining;
      }
      server.to(roomId).emit(SocketEvents.GAME_TIMER_TICK, { matchId, remaining });
      if (remaining <= 0) {
        clearInterval(interval);
        this.timers.delete(matchId);
        if (roundId) {
          this.prisma.round.update({ where: { id: roundId }, data: { endedAt: new Date() } }).catch(() => undefined);
        }
        this.runStep(matchId, roomId, server, steps, index + 1).catch((err) =>
          console.error(`match ${matchId} step failed:`, err),
        );
      }
    }, 1000);
    this.timers.set(matchId, interval);
  }

  /**
   * Replays the current game state to a player who reconnects after a
   * browser refresh/close. The normal live events are broadcast only once,
   * so a returning client needs a point-in-time snapshot to rebuild its UI.
   */
  async syncStateToClient(roomId: string, client: Socket) {
    const pending = this.pendingTopicVotes.get(roomId);
    if (pending) {
      const counts: Record<string, number> = {};
      for (const candidate of pending.candidates) counts[candidate.topicId] = 0;
      for (const topicId of pending.votes.values()) {
        counts[topicId] = (counts[topicId] ?? 0) + 1;
      }

      client.emit(SocketEvents.GAME_TOPIC_VOTE_STARTED, {
        candidates: pending.candidates.map(({ topicId, text }) => ({ topicId, text })),
        durationSeconds: TOPIC_VOTE_SECONDS,
        debaterA: pending.debaterA,
        debaterB: pending.debaterB,
      });
      client.emit(SocketEvents.GAME_TOPIC_VOTE_UPDATE, { counts });
      client.emit(SocketEvents.GAME_TOPIC_VOTE_TICK, { remaining: pending.remaining });
      return;
    }

    const active = [...this.activeMatches.entries()].find(([, state]) => state.roomId === roomId);
    if (!active) return;

    const [matchId, state] = active;
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        topic: true,
        debaterA: true,
        debaterB: true,
      },
    });

    if (!match || match.status === MatchStatus.COMPLETED) return;

    client.emit(SocketEvents.GAME_MATCH_STARTED, {
      matchId: match.id,
      topic: match.topic.text,
      debaterA: {
        userId: match.debaterAId,
        username: match.debaterA.username,
        stanceLabel: match.topic.stanceALabel,
      },
      debaterB: {
        userId: match.debaterBId,
        username: match.debaterB.username,
        stanceLabel: match.topic.stanceBLabel,
      },
    });

    client.emit(SocketEvents.GAME_PHASE_CHANGED, {
      matchId: match.id,
      phase: state.phase,
      durationSeconds: state.durationSeconds,
      speakerId: state.currentSpeakerId ?? undefined,
    });

    client.emit(SocketEvents.GAME_TIMER_TICK, {
      matchId: match.id,
      remaining: state.remainingSeconds,
    });
  }

  private async finishMatch(matchId: string, roomId: string, server: Server) {
    const match = await this.prisma.match.findUniqueOrThrow({ where: { id: matchId } });

    const tally = await this.votingService.tally(matchId, match.debaterAId, match.debaterBId);
    const correctPredictorIds = await this.votingService.resolvePredictions(matchId, tally.winnerId);
    const xpAwarded = await this.xpService.awardMatchResults({
      matchId,
      winnerId: tally.winnerId,
      isDraw: tally.isDraw,
      debaterAId: match.debaterAId,
      debaterBId: match.debaterBId,
      correctPredictorIds,
    });

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.COMPLETED,
        winnerId: tally.winnerId,
        isDraw: tally.isDraw,
        endedAt: new Date(),
      },
    });
    await this.roomsService.setRoomStatus(roomId, RoomStatus.LOBBY);

    server.to(roomId).emit(SocketEvents.RESULTS_WINNER_ANNOUNCED, {
      matchId,
      winnerId: tally.winnerId,
      isDraw: tally.isDraw,
      votes: { debaterA: tally.debaterAVotes, debaterB: tally.debaterBVotes },
      xpAwarded,
      correctPredictorIds,
    });

    this.activeMatches.delete(matchId);
  }
}
