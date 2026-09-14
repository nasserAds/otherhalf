"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const rooms_service_1 = require("../rooms/rooms.service");
const topics_service_1 = require("../topics/topics.service");
const voting_service_1 = require("../voting/voting.service");
const xp_service_1 = require("../xp/xp.service");
const socket_events_1 = require("../common/socket-events");
const DURATIONS = {
    PREPARING: 25,
    ROUND_1: 50,
    ROUND_2: 35,
    FINAL: 25,
    VOTING: 18,
};
const TOPIC_VOTE_SECONDS = 12;
const TOPIC_CANDIDATE_COUNT = 3;
let GameService = class GameService {
    constructor(prisma, roomsService, topicsService, votingService, xpService) {
        this.prisma = prisma;
        this.roomsService = roomsService;
        this.topicsService = topicsService;
        this.votingService = votingService;
        this.xpService = xpService;
        this.timers = new Map();
        this.activeMatches = new Map();
        this.pendingTopicVotes = new Map();
    }
    async startMatch(roomId, server) {
        if (this.pendingTopicVotes.has(roomId)) {
            throw new common_1.BadRequestException('a topic vote is already in progress for this room');
        }
        const room = await this.roomsService.getRoomById(roomId);
        const eligible = room.players.filter((p) => p.isOnline);
        if (eligible.length < 2) {
            throw new common_1.BadRequestException('need at least 2 online players to start a match');
        }
        const shuffled = [...eligible];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const [debaterAPlayer, debaterBPlayer] = shuffled;
        const debaterA = { userId: debaterAPlayer.userId, username: debaterAPlayer.user.username };
        const debaterB = { userId: debaterBPlayer.userId, username: debaterBPlayer.user.username };
        const usedTopicIds = (await this.prisma.match.findMany({ where: { roomId }, select: { topicId: true } })).map((m) => m.topicId);
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
            server.to(roomId).emit(socket_events_1.SocketEvents.GAME_TOPIC_VOTE_TICK, { remaining: pending.remaining });
            if (pending.remaining <= 0) {
                clearInterval(timer);
                this.resolveTopicVote(roomId, server).catch((err) => console.error(`topic vote resolve failed for room ${roomId}:`, err));
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
        server.to(roomId).emit(socket_events_1.SocketEvents.GAME_TOPIC_VOTE_STARTED, {
            candidates: candidates.map(({ topicId, text }) => ({ topicId, text })),
            durationSeconds: TOPIC_VOTE_SECONDS,
            debaterA,
            debaterB,
        });
    }
    castTopicVote(roomId, userId, topicId, server) {
        const pending = this.pendingTopicVotes.get(roomId);
        if (!pending) {
            throw new common_1.BadRequestException('no topic vote is currently open for this room');
        }
        if (!pending.candidates.some((c) => c.topicId === topicId)) {
            throw new common_1.BadRequestException('not a valid candidate topic');
        }
        pending.votes.set(userId, topicId);
        const counts = {};
        for (const c of pending.candidates)
            counts[c.topicId] = 0;
        for (const votedId of pending.votes.values())
            counts[votedId] = (counts[votedId] ?? 0) + 1;
        server.to(roomId).emit(socket_events_1.SocketEvents.GAME_TOPIC_VOTE_UPDATE, { counts });
    }
    async resolveTopicVote(roomId, server) {
        const pending = this.pendingTopicVotes.get(roomId);
        if (!pending)
            return;
        this.pendingTopicVotes.delete(roomId);
        const counts = new Map();
        for (const c of pending.candidates)
            counts.set(c.topicId, 0);
        for (const votedId of pending.votes.values())
            counts.set(votedId, (counts.get(votedId) ?? 0) + 1);
        const maxVotes = Math.max(...counts.values());
        const winners = pending.candidates.filter((c) => counts.get(c.topicId) === maxVotes);
        const winningTopic = winners[Math.floor(Math.random() * winners.length)];
        await this.beginMatch(roomId, server, pending.debaterA, pending.debaterB, winningTopic);
    }
    async beginMatch(roomId, server, debaterA, debaterB, topic) {
        const match = await this.prisma.match.create({
            data: {
                roomId,
                topicId: topic.topicId,
                debaterAId: debaterA.userId,
                debaterBId: debaterB.userId,
                status: client_1.MatchStatus.PREPARING,
            },
        });
        await this.roomsService.setRoomStatus(roomId, client_1.RoomStatus.IN_PROGRESS);
        this.activeMatches.set(match.id, { roomId, currentRoundId: null, currentSpeakerId: null });
        server.to(roomId).emit(socket_events_1.SocketEvents.GAME_MATCH_STARTED, {
            matchId: match.id,
            topic: topic.text,
            debaterA: { userId: debaterA.userId, username: debaterA.username, stanceLabel: topic.stanceALabel },
            debaterB: { userId: debaterB.userId, username: debaterB.username, stanceLabel: topic.stanceBLabel },
        });
        const steps = this.buildSteps(debaterA.userId, debaterB.userId);
        this.runStep(match.id, roomId, server, steps, 0).catch((err) => console.error(`match ${match.id} step failed:`, err));
        return match;
    }
    async submitTurn(matchId, userId, content) {
        const state = this.activeMatches.get(matchId);
        if (!state || state.currentSpeakerId !== userId || !state.currentRoundId) {
            throw new common_1.BadRequestException('it is not your turn to speak right now');
        }
        return this.prisma.round.update({
            where: { id: state.currentRoundId },
            data: { content },
        });
    }
    buildSteps(debaterAId, debaterBId) {
        return [
            { phase: client_1.MatchStatus.PREPARING, roundType: client_1.RoundType.PREP, duration: DURATIONS.PREPARING, speakerId: null },
            { phase: client_1.MatchStatus.ROUND_1, roundType: client_1.RoundType.ROUND_1, duration: DURATIONS.ROUND_1, speakerId: debaterAId },
            { phase: client_1.MatchStatus.ROUND_1, roundType: client_1.RoundType.ROUND_1, duration: DURATIONS.ROUND_1, speakerId: debaterBId },
            { phase: client_1.MatchStatus.ROUND_2, roundType: client_1.RoundType.ROUND_2, duration: DURATIONS.ROUND_2, speakerId: debaterAId },
            { phase: client_1.MatchStatus.ROUND_2, roundType: client_1.RoundType.ROUND_2, duration: DURATIONS.ROUND_2, speakerId: debaterBId },
            { phase: client_1.MatchStatus.FINAL, roundType: client_1.RoundType.FINAL, duration: DURATIONS.FINAL, speakerId: debaterAId },
            { phase: client_1.MatchStatus.FINAL, roundType: client_1.RoundType.FINAL, duration: DURATIONS.FINAL, speakerId: debaterBId },
            { phase: client_1.MatchStatus.VOTING, roundType: null, duration: DURATIONS.VOTING, speakerId: null },
        ];
    }
    async runStep(matchId, roomId, server, steps, index) {
        if (index >= steps.length) {
            await this.finishMatch(matchId, roomId, server);
            return;
        }
        const step = steps[index];
        await this.prisma.match.update({ where: { id: matchId }, data: { status: step.phase } });
        let roundId = null;
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
        this.activeMatches.set(matchId, { roomId, currentRoundId: roundId, currentSpeakerId: step.speakerId });
        server.to(roomId).emit(socket_events_1.SocketEvents.GAME_PHASE_CHANGED, {
            matchId,
            phase: step.phase,
            durationSeconds: step.duration,
            speakerId: step.speakerId ?? undefined,
        });
        let remaining = step.duration;
        const interval = setInterval(() => {
            remaining -= 1;
            server.to(roomId).emit(socket_events_1.SocketEvents.GAME_TIMER_TICK, { matchId, remaining });
            if (remaining <= 0) {
                clearInterval(interval);
                this.timers.delete(matchId);
                if (roundId) {
                    this.prisma.round.update({ where: { id: roundId }, data: { endedAt: new Date() } }).catch(() => undefined);
                }
                this.runStep(matchId, roomId, server, steps, index + 1).catch((err) => console.error(`match ${matchId} step failed:`, err));
            }
        }, 1000);
        this.timers.set(matchId, interval);
    }
    async finishMatch(matchId, roomId, server) {
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
                status: client_1.MatchStatus.COMPLETED,
                winnerId: tally.winnerId,
                isDraw: tally.isDraw,
                endedAt: new Date(),
            },
        });
        await this.roomsService.setRoomStatus(roomId, client_1.RoomStatus.LOBBY);
        server.to(roomId).emit(socket_events_1.SocketEvents.RESULTS_WINNER_ANNOUNCED, {
            matchId,
            winnerId: tally.winnerId,
            isDraw: tally.isDraw,
            votes: { debaterA: tally.debaterAVotes, debaterB: tally.debaterBVotes },
            xpAwarded,
            correctPredictorIds,
        });
        this.activeMatches.delete(matchId);
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rooms_service_1.RoomsService,
        topics_service_1.TopicsService,
        voting_service_1.VotingService,
        xp_service_1.XpService])
], GameService);
//# sourceMappingURL=game.service.js.map