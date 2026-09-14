import { DebateMode, RoomStatus, RoomVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto';
export interface DepartureResult {
    newHostUserId: string | null;
    roomDeleted: boolean;
}
export interface UpdateRoomSettingsInput {
    maxPlayers?: number;
    debateMode?: DebateMode;
    visibility?: RoomVisibility;
}
export declare class RoomsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRoom(hostId: string, dto: CreateRoomDto): Promise<{
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
    joinRoomByCode(userId: string, code: string): Promise<({
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
    leaveRoom(userId: string, roomId: string): Promise<DepartureResult>;
    kickPlayer(roomId: string, targetUserId: string): Promise<DepartureResult>;
    private handleDeparture;
    setPresence(userId: string, roomId: string, isOnline: boolean): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.PlayerRole;
        isReady: boolean;
        isOnline: boolean;
        joinedAt: Date;
        leftAt: Date | null;
        roomId: string;
    } | null>;
    setReady(userId: string, roomId: string, isReady: boolean): Promise<{
        id: string;
        userId: string;
        role: import(".prisma/client").$Enums.PlayerRole;
        isReady: boolean;
        isOnline: boolean;
        joinedAt: Date;
        leftAt: Date | null;
        roomId: string;
    }>;
    assertIsHost(userId: string, roomId: string): Promise<void>;
    updateRoomSettings(roomId: string, input: UpdateRoomSettingsInput): Promise<{
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
    listPublicRooms(take?: number): Promise<{
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
    getRoomByCode(code: string): Promise<{
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
    getRoomById(roomId: string): Promise<{
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
    setRoomStatus(roomId: string, status: RoomStatus): Promise<{
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
    private generateUniqueCode;
    private readonly roomInclude;
}
