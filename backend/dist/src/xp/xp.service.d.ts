import { PrismaService } from '../prisma/prisma.service';
interface MatchResultInput {
    matchId: string;
    winnerId: string | null;
    isDraw: boolean;
    debaterAId: string;
    debaterBId: string;
    correctPredictorIds: string[];
}
export declare class XpService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    awardMatchResults(input: MatchResultInput): Promise<Record<string, number>>;
}
export {};
