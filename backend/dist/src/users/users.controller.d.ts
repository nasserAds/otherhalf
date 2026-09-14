import { AuthUser } from '../common/decorators';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        avatar: import(".prisma/client").$Enums.Avatar;
        xp: number;
        coins: number;
        wins: number;
        losses: number;
    }>;
    getMyXpHistory(user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        matchId: string | null;
        type: import(".prisma/client").$Enums.XpTransactionType;
        xpAmount: number;
        coinAmount: number;
    }[]>;
}
