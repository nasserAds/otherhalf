import { PrismaService } from '../prisma/prisma.service';
export declare class VotingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    castVote(matchId: string, voterId: string, votedForId: string): Promise<{
        id: string;
        createdAt: Date;
        matchId: string;
        voterId: string;
        votedForId: string;
    }>;
    castPrediction(matchId: string, predictorId: string, predictedWinnerId: string): Promise<{
        id: string;
        createdAt: Date;
        matchId: string;
        predictorId: string;
        predictedWinnerId: string;
        isCorrect: boolean | null;
    }>;
    tally(matchId: string, debaterAId: string, debaterBId: string): Promise<{
        debaterAVotes: number;
        debaterBVotes: number;
        winnerId: string | null;
        isDraw: boolean;
    }>;
    resolvePredictions(matchId: string, winnerId: string | null): Promise<string[]>;
    private getMatchDebaters;
}
