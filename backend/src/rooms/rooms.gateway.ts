import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { IsString, Length } from 'class-validator';
import { NotFoundException, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import { RoomsService } from './rooms.service';
import { SocketEvents } from '../common/socket-events';
import { WsExceptionFilter } from '../common/filters';

class JoinRoomSocketDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

// How long a disconnected player's seat is held before we treat it as a
// real departure (and, if they were host, transfer the crown). Covers
// flaky mobile connections / phone-lock without punishing the player.
const RECONNECT_GRACE_MS = 30_000;

@UseFilters(WsExceptionFilter)
@WebSocketGateway({ cors: true, path: '/api/backend/socket.io' })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private redisPubClient?: RedisClientType;
  private redisSubClient?: RedisClientType;
  @WebSocketServer() server!: Server;

  async afterInit(server: Server) {
    // Vercel/Upstash may expose the same Redis database through either
    // REDIS_URL or KV_URL. Prefer REDIS_URL, but keep KV_URL as a fallback
    // so the adapter still works if the integration changes its variable set.
    const redisUrl = process.env.REDIS_URL ?? process.env.KV_URL;
    if (!redisUrl) {
      console.warn(
        'No REDIS_URL/KV_URL configured; realtime events are local to one backend instance.',
      );
      return;
    }

    this.redisPubClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 250, 5000),
      },
    });
    this.redisSubClient = this.redisPubClient.duplicate();

    this.redisPubClient.on('error', (error) => {
      console.error('Socket.IO Redis pub client error:', error);
    });
    this.redisSubClient.on('error', (error) => {
      console.error('Socket.IO Redis sub client error:', error);
    });

    try {
      await Promise.all([this.redisPubClient.connect(), this.redisSubClient.connect()]);
      server.adapter(createAdapter(this.redisPubClient, this.redisSubClient));
      console.log('Socket.IO Redis adapter enabled.');
    } catch (error) {
      console.error(
        'Failed to initialize Socket.IO Redis adapter; realtime events will remain local to this backend instance.',
        error,
      );

      await Promise.allSettled([
        this.redisPubClient.quit(),
        this.redisSubClient.quit(),
      ]);
      this.redisPubClient = undefined;
      this.redisSubClient = undefined;
    }
  }

  // key: `${roomId}:${userId}` -> pending "treat as left" timer
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly jwtService: JwtService,
  ) {}

  // Every socket must present a valid JWT at handshake time — sockets that
  // don't are dropped immediately rather than allowed to linger and probe.
  // Also joins a personal Socket.IO room keyed by userId, so other parts of
  // the app (see voice/voice.gateway.ts) can address this specific
  // connection directly via server.to(userId) without RoomsGateway having
  // to know anything about them.
  notifyRoomClosed(roomId: string) {
    this.server.to(roomId).emit(SocketEvents.ROOM_CLOSED, { roomId });
    this.server.in(roomId).socketsLeave(roomId);
  }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify(token);
      client.data.user = { userId: payload.sub, username: payload.username };
      client.join(payload.sub);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    if (!user || !roomId) return;

    await this.roomsService.setPresence(user.userId, roomId, false);
    this.server.to(roomId).emit(SocketEvents.PRESENCE_OFFLINE, { userId: user.userId });

    const key = `${roomId}:${user.userId}`;
    const timer = setTimeout(async () => {
      const result = await this.roomsService.leaveRoom(user.userId, roomId).catch(() => null);
      this.disconnectTimers.delete(key);
      if (!result) return; // e.g. room/membership already gone
      if (result.roomDeleted) {
        this.server.to(roomId).emit(SocketEvents.ROOM_CLOSED, {});
        return;
      }
      this.server.to(roomId).emit(SocketEvents.LOBBY_PLAYER_LEFT, { userId: user.userId });
      if (result.newHostUserId) {
        this.server
          .to(roomId)
          .emit(SocketEvents.LOBBY_HOST_TRANSFERRED, { newHostUserId: result.newHostUserId });
      }
      const room = await this.roomsService.getRoomById(roomId);
      this.server.to(roomId).emit(SocketEvents.ROOM_STATE_SYNC, room);
    }, RECONNECT_GRACE_MS);
    this.disconnectTimers.set(key, timer);
  }

  @SubscribeMessage(SocketEvents.ROOM_JOIN)
  async onRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinRoomSocketDto,
  ) {
    const user = client.data.user;
    const room = await this.roomsService.joinRoomByCode(user.userId, body.code);
    if (!room) {
      throw new NotFoundException('room not found');
    }

    // Cancel any pending "treat as left" timer from a recent disconnect.
    const key = `${room.id}:${user.userId}`;
    const pending = this.disconnectTimers.get(key);
    if (pending) {
      clearTimeout(pending);
      this.disconnectTimers.delete(key);
    }

    const wasAlreadyInRoom = client.data.roomId === room.id;
    client.data.roomId = room.id;
    client.join(room.id);

    if (!wasAlreadyInRoom) {
      this.server.to(room.id).emit(SocketEvents.LOBBY_PLAYER_JOINED, {
        userId: user.userId,
        username: user.username,
      });
    }

    // Full state resync for everyone keeps all clients aligned after joins,
    // reconnects, and device changes without asking clients to re-join.
    this.server.to(room.id).emit(SocketEvents.ROOM_STATE_SYNC, room);
    const recentMessages = await this.roomsService.recentChatMessages(room.id);
    client.emit(
      SocketEvents.LOBBY_CHAT_HISTORY,
      recentMessages.map((message) => ({
        id: message.id,
        userId: message.userId,
        username: message.user.username,
        content: message.content,
        createdAt: message.createdAt,
      })),
    );
    return room;
  }

  @SubscribeMessage(SocketEvents.LOBBY_READY_TOGGLE)
  async onReadyToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { isReady: boolean },
  ) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    if (!roomId) return;

    const isReady = Boolean(body?.isReady);
    const player = await this.roomsService.setReady(user.userId, roomId, isReady);
    this.server.to(roomId).emit(SocketEvents.LOBBY_PLAYER_READY_CHANGED, {
      userId: user.userId,
      isReady: player.isReady,
    });
  }

  @SubscribeMessage(SocketEvents.ROOM_LEAVE)
  async onRoomLeave(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    const roomId = client.data.roomId;
    if (!roomId) return;

    const result = await this.roomsService.leaveRoom(user.userId, roomId);
    client.leave(roomId);
    client.data.roomId = undefined;

    if (result.roomDeleted) {
      this.server.to(roomId).emit(SocketEvents.ROOM_CLOSED, {});
      return;
    }
    this.server.to(roomId).emit(SocketEvents.LOBBY_PLAYER_LEFT, { userId: user.userId });
    if (result.newHostUserId) {
      this.server
        .to(roomId)
        .emit(SocketEvents.LOBBY_HOST_TRANSFERRED, { newHostUserId: result.newHostUserId });
    }
    const room = await this.roomsService.getRoomById(roomId);
    this.server.to(roomId).emit(SocketEvents.ROOM_STATE_SYNC, room);
  }
}
