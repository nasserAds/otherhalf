import { AuthUser } from '../common/decorators';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, JoinRoomDto, ListPublicRoomsDto } from './dto';
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
    create(user: AuthUser, dto: CreateRoomDto): Promise<{
        players: ({
            user: {
                id: string;
                createdAt: Date;
                username: string;
                avatar: import(".prisma/client").$Enums.Avatar;
                deviceSecretHash: string;
                xp: number;
                coins: number;
                wins: number;
                losses: number;
                updatedAt: Date;
            };
        } & {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.PlayerRole;
            isReady: boolean;
            isOnline: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            roomId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        maxPlayers: number;
        debateMode: import(".prisma/client").$Enums.DebateMode;
        visibility: import(".prisma/client").$Enums.RoomVisibility;
        code: string;
        status: import(".prisma/client").$Enums.RoomStatus;
        hostId: string;
    }>;
    join(user: AuthUser, dto: JoinRoomDto): Promise<({
        players: ({
            user: {
                id: string;
                createdAt: Date;
                username: string;
                avatar: import(".prisma/client").$Enums.Avatar;
                deviceSecretHash: string;
                xp: number;
                coins: number;
                wins: number;
                losses: number;
                updatedAt: Date;
            };
        } & {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.PlayerRole;
            isReady: boolean;
            isOnline: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            roomId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        maxPlayers: number;
        debateMode: import(".prisma/client").$Enums.DebateMode;
        visibility: import(".prisma/client").$Enums.RoomVisibility;
        code: string;
        status: import(".prisma/client").$Enums.RoomStatus;
        hostId: string;
    }) | null>;
    listPublic(query: ListPublicRoomsDto): Promise<{
        id: string;
        _count: {
            players: number;
        };
        maxPlayers: number;
        debateMode: import(".prisma/client").$Enums.DebateMode;
        code: string;
        host: {
            username: string;
            avatar: import(".prisma/client").$Enums.Avatar;
        };
    }[]>;
    getByCode(code: string): Promise<{
        players: ({
            user: {
                id: string;
                createdAt: Date;
                username: string;
                avatar: import(".prisma/client").$Enums.Avatar;
                deviceSecretHash: string;
                xp: number;
                coins: number;
                wins: number;
                losses: number;
                updatedAt: Date;
            };
        } & {
            id: string;
            userId: string;
            role: import(".prisma/client").$Enums.PlayerRole;
            isReady: boolean;
            isOnline: boolean;
            joinedAt: Date;
            leftAt: Date | null;
            roomId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        maxPlayers: number;
        debateMode: import(".prisma/client").$Enums.DebateMode;
        visibility: import(".prisma/client").$Enums.RoomVisibility;
        code: string;
        status: import(".prisma/client").$Enums.RoomStatus;
        hostId: string;
    }>;
}
