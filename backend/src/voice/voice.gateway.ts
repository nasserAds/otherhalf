import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { IsBoolean, IsObject, IsString } from 'class-validator';
import { UseFilters, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from '../common/guards';
import { WsExceptionFilter } from '../common/filters';
import { SocketEvents } from '../common/socket-events';

class SignalDto {
  @IsString()
  targetUserId!: string;

  // SDP offer/answer or an ICE candidate — shape is opaque to the server on
  // purpose; it's just relayed byte-for-byte to the target peer.
  @IsObject()
  data!: Record<string, unknown>;
}

class MicStateDto {
  @IsBoolean()
  isMicOn!: boolean;
}

// A room can have at most one of these "active voice" sets at a time, keyed
// by roomId, tracking which userIds currently have their mic session open.
// This is purely for peer *discovery* (who should I dial when I join) — the
// actual audio never passes through the server, it flows peer-to-peer once
// the mesh connections are established.
@UseFilters(WsExceptionFilter)
@UseGuards(WsJwtGuard)
@WebSocketGateway({ cors: true })
export class VoiceGateway implements OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private activeByRoom = new Map<string, Set<string>>();
  // reverse index so a disconnect can find which room(s) to clean up
  private roomByUser = new Map<string, string>();

  @SubscribeMessage(SocketEvents.VOICE_JOIN)
  onJoin(@ConnectedSocket() client: Socket) {
    const { roomId, user } = this.requireRoom(client);
    const active = this.activeByRoom.get(roomId) ?? new Set<string>();
    this.activeByRoom.set(roomId, active);

    // Tell the joiner who's already there — they'll wait for each of these
    // peers to send an offer (see the frontend hook), avoiding both sides
    // racing to initiate the same connection.
    const peerIds = [...active].filter((id) => id !== user.userId);
    client.emit(SocketEvents.VOICE_ACTIVE_PEERS, { peerIds });

    active.add(user.userId);
    this.roomByUser.set(user.userId, roomId);
    client.to(roomId).emit(SocketEvents.VOICE_PEER_JOINED, { userId: user.userId });
  }

  @SubscribeMessage(SocketEvents.VOICE_LEAVE)
  onLeave(@ConnectedSocket() client: Socket) {
    const { roomId, user } = this.requireRoom(client);
    this.removeFromVoice(roomId, user.userId);
    client.to(roomId).emit(SocketEvents.VOICE_PEER_LEFT, { userId: user.userId });
  }

  // Pure relay — forwarded to the target's personal room (see
  // RoomsGateway.handleConnection, which joins every socket to
  // room(userId)) so it reaches that exact browser tab.
  @SubscribeMessage(SocketEvents.VOICE_SIGNAL)
  onSignal(@ConnectedSocket() client: Socket, @MessageBody() body: SignalDto) {
    const { user } = this.requireRoom(client);
    this.server.to(body.targetUserId).emit(SocketEvents.VOICE_SIGNAL, {
      fromUserId: user.userId,
      data: body.data,
    });
  }

  // Cosmetic broadcast only (mic-on/off badge in the UI) — independent of
  // join/leave so a later "connected but muted" state is possible without a
  // protocol change.
  @SubscribeMessage(SocketEvents.VOICE_MIC_STATE)
  onMicState(@ConnectedSocket() client: Socket, @MessageBody() body: MicStateDto) {
    const { roomId, user } = this.requireRoom(client);
    this.server.to(roomId).emit(SocketEvents.VOICE_MIC_STATE, {
      userId: user.userId,
      isMicOn: body.isMicOn,
    });
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;
    const roomId = this.roomByUser.get(user.userId);
    if (!roomId) return;
    this.removeFromVoice(roomId, user.userId);
    client.to(roomId).emit(SocketEvents.VOICE_PEER_LEFT, { userId: user.userId });
  }

  private removeFromVoice(roomId: string, userId: string) {
    this.activeByRoom.get(roomId)?.delete(userId);
    this.roomByUser.delete(userId);
  }

  private requireRoom(client: Socket): { roomId: string; user: { userId: string; username: string } } {
    const user = client.data.user;
    const roomId = client.data.roomId;
    if (!user || !roomId) {
      throw new WsException('you must join a room before using voice chat');
    }
    return { roomId, user };
  }
}
