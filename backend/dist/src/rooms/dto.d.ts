import { DebateMode, RoomVisibility } from '@prisma/client';
export declare class CreateRoomDto {
    maxPlayers: number;
    debateMode: DebateMode;
    visibility: RoomVisibility;
}
export declare class JoinRoomDto {
    code: string;
}
export declare class ListPublicRoomsDto {
    take?: number;
}
