import { PrismaService } from '../prisma/prisma.service';
export declare class LobbyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    saveChatMessage(roomId: string, userId: string, content: string): Promise<{
        user: {
            username: string;
            avatar: import(".prisma/client").$Enums.Avatar;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        roomId: string;
        content: string;
    }>;
    recentMessages(roomId: string, take?: number): Promise<({
        user: {
            username: string;
            avatar: import(".prisma/client").$Enums.Avatar;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        roomId: string;
        content: string;
    })[]>;
}
