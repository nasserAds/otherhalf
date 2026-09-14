import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        avatar: import(".prisma/client").$Enums.Avatar;
        xp: number;
        coins: number;
        wins: number;
        losses: number;
    }>;
    getXpHistory(userId: string, take?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        matchId: string | null;
        type: import(".prisma/client").$Enums.XpTransactionType;
        xpAmount: number;
        coinAmount: number;
    }[]>;
}
