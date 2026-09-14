import { DebateMode, RoomVisibility } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { LobbyService } from './lobby.service';
import { GameService } from '../game/game.service';
import { ChatMessageDto } from './dto';
declare class ReadyToggleDto {
    isReady: boolean;
}
declare class KickPlayerDto {
    userId: string;
}
declare class UpdateSettingsDto {
    maxPlayers?: number;
    debateMode?: DebateMode;
    visibility?: RoomVisibility;
}
export declare class LobbyGateway {
    private readonly roomsService;
    private readonly lobbyService;
    private readonly gameService;
    server: Server;
    constructor(roomsService: RoomsService, lobbyService: LobbyService, gameService: GameService);
    onReadyToggle(client: Socket, body: ReadyToggleDto): Promise<void>;
    onChatMessage(client: Socket, body: ChatMessageDto): Promise<void>;
    onStartMatch(client: Socket): Promise<void>;
    onKickPlayer(client: Socket, body: KickPlayerDto): Promise<void>;
    onUpdateSettings(client: Socket, body: UpdateSettingsDto): Promise<void>;
}
export {};
