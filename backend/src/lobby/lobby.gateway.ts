import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UseFilters, UseGuards, BadRequestException } from '@nestjs/common';
import { DebateMode, RoomVisibility } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../common/guards';
import { WsExceptionFilter } from '../common/filters';
import { SocketEvents } from '../common/socket-events';
import { RoomsService } from '../rooms/rooms.service';
import { LobbyService } from './lobby.service';
import { GameService } from '../game/game.service';
import { ChatMessageDto } from './dto';

class ReadyToggleDto {
  @IsBoolean()
  isReady!: boolean;
}

class KickPlayerDto {
  @IsString()
  userId!: string;
}

class UpdateSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(12)
  maxPlayers?: number;

  @IsOptional()
  @IsEnum(DebateMode)
  debateMode?: DebateMode;

  @IsOptional()
  @IsEnum(RoomVisibility)
  visibility?: RoomVisibility;
}

@UseFilters(WsExceptionFilter)
@UseGuards(WsJwtGuard)
@WebSocketGateway({ cors: true })
export class LobbyGateway {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly lobbyService: LobbyService,
    private readonly gameService: GameService,
  ) {}

  @SubscribeMessage(SocketEvents.LOBBY_READY_TOGGLE)
  async onReadyToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ReadyToggleDto,
  ) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    await this.roomsService.setReady(user.userId, roomId, body.isReady);
    this.server.to(roomId).emit(SocketEvents.LOBBY_PLAYER_READY_CHANGED, {
      userId: user.userId,
      isReady: body.isReady,
    });
  }

  @SubscribeMessage(SocketEvents.LOBBY_CHAT_MESSAGE)
  async onChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: ChatMessageDto,
  ) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    const message = await this.lobbyService.saveChatMessage(roomId, user.userId, body.content);
    this.server.to(roomId).emit(SocketEvents.LOBBY_CHAT_MESSAGE, {
      id: message.id,
      userId: user.userId,
      username: user.username,
      content: message.content,
      createdAt: message.createdAt,
    });
  }

  // Host-only. Validated server-side (never trust a client-side "I'm host"
  // flag) via RoomsService.assertIsHost before anything starts.
  @SubscribeMessage(SocketEvents.LOBBY_START_MATCH)
  async onStartMatch(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    await this.roomsService.assertIsHost(user.userId, roomId);
    await this.gameService.startMatch(roomId, this.server);
  }

  // Host-only. The kicked player is told directly (their personal room,
  // see RoomsGateway.handleConnection) so their client can bounce them out
  // even though they're no longer subscribed to the room's broadcasts.
  @SubscribeMessage(SocketEvents.LOBBY_KICK_PLAYER)
  async onKickPlayer(@ConnectedSocket() client: Socket, @MessageBody() body: KickPlayerDto) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    await this.roomsService.assertIsHost(user.userId, roomId);
    if (body.userId === user.userId) {
      throw new WsException('cannot kick yourself');
    }

    const result = await this.roomsService.kickPlayer(roomId, body.userId);
    this.server.to(body.userId).emit(SocketEvents.LOBBY_KICKED, {});
    this.server.to(roomId).emit(SocketEvents.LOBBY_PLAYER_LEFT, { userId: body.userId });
    if (result.newHostUserId) {
      this.server
        .to(roomId)
        .emit(SocketEvents.LOBBY_HOST_TRANSFERRED, { newHostUserId: result.newHostUserId });
    }
    const room = await this.roomsService.getRoomById(roomId);
    this.server.to(roomId).emit(SocketEvents.ROOM_STATE_SYNC, room);
  }

  // Host-only. Broadcasts a full state resync rather than a narrow "settings
  // changed" event — simplest way to keep every client's maxPlayers/mode/
  // visibility in sync without a second payload shape to maintain.
  @SubscribeMessage(SocketEvents.LOBBY_UPDATE_SETTINGS)
  async onUpdateSettings(@ConnectedSocket() client: Socket, @MessageBody() body: UpdateSettingsDto) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    await this.roomsService.assertIsHost(user.userId, roomId);
    if (Object.keys(body).length === 0) {
      throw new BadRequestException('no settings provided');
    }
    const room = await this.roomsService.updateRoomSettings(roomId, body);
    this.server.to(roomId).emit(SocketEvents.ROOM_STATE_SYNC, room);
  }
}
