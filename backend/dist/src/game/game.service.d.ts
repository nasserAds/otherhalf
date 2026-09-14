import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { TopicsService } from '../topics/topics.service';
import { VotingService } from '../voting/voting.service';
import { XpService } from '../xp/xp.service';
export declare class GameService {
    private readonly prisma;
    private readonly roomsService;
    private readonly topicsService;
    private readonly votingService;
    private readonly xpService;
    private timers;
    private activeMatches;
    private pendingTopicVotes;
    constructor(prisma: PrismaService, roomsService: RoomsService, topicsService: TopicsService, votingService: VotingService, xpService: XpService);
    startMatch(roomId: string, server: Server): Promise<void>;
    castTopicVote(roomId: string, userId: string, topicId: string, server: Server): void;
    private resolveTopicVote;
    private beginMatch;
    submitTurn(matchId: string, userId: string, content: string): Promise<{
        id: string;
        matchId: string;
        type: import(".prisma/client").$Enums.RoundType;
        startedAt: Date;
        endedAt: Date | null;
        speakerId: string | null;
        content: string | null;
        durationSeconds: number;
    }>;
    private buildSteps;
    private runStep;
    private finishMatch;
}
