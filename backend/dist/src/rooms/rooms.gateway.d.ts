import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
declare class JoinRoomSocketDto {
    code: string;
}
export declare class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly roomsService;
    private readonly jwtService;
    server: Server;
    private disconnectTimers;
    constructor(roomsService: RoomsService, jwtService: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): Promise<void>;
    onRoomJoin(client: Socket, body: JoinRoomSocketDto): Promise<{
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
    onRoomLeave(client: Socket): Promise<void>;
}
export {};
