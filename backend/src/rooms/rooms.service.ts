import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DebateMode, PlayerRole, RoomStatus, RoomVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateRoomCode } from '../common/room-code.util';
import { CreateRoomDto } from './dto';

const MAX_CODE_ATTEMPTS = 5;

export interface DepartureResult {
  newHostUserId: string | null;
  roomDeleted: boolean;
}

export interface UpdateRoomSettingsInput {
  maxPlayers?: number;
  debateMode?: DebateMode;
  visibility?: RoomVisibility;
}

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(hostId: string, dto: CreateRoomDto) {
    const code = await this.generateUniqueCode();

    return this.prisma.room.create({
      data: {
        code,
        hostId,
        maxPlayers: dto.maxPlayers,
        debateMode: dto.debateMode,
        visibility: dto.visibility,
        players: {
          create: { userId: hostId, role: PlayerRole.HOST, isReady: true },
        },
      },
      include: this.roomInclude,
    });
  }

  async joinRoomByCode(userId: string, code: string) {
    const room = await this.prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: this.roomInclude,
    });
    if (!room) throw new NotFoundException('room not found');

    // Look up membership before checking the room status. A player who was
    // already in this room must be allowed to reconnect even while a match
    // is in progress; a brand-new player still cannot join an active match.
    const existingMembership = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    });

    if (!existingMembership && room.status !== RoomStatus.LOBBY) {
      throw new BadRequestException('this room is not accepting new players right now');
    }

    // A former host/player must be able to rejoin the same room without
    // colliding with their retained unique roomPlayer row.
    if (existingMembership) {
      // Rejoin: bring an existing member back online rather than duplicating them.
      await this.prisma.roomPlayer.update({
        where: { id: existingMembership.id },
        data: {
          isOnline: true,
          leftAt: null,
          // If the host left and ownership transferred, they return as a
          // normal player. The current room host remains the only host.
          role: room.hostId === userId ? PlayerRole.HOST : PlayerRole.PLAYER,
        },
      });
    } else {
      const activePlayerCount = room.players.filter((p) => p.leftAt === null).length;
      if (activePlayerCount >= room.maxPlayers) {
        throw new BadRequestException('room is full');
      }
      await this.prisma.roomPlayer.create({
        data: { roomId: room.id, userId, role: PlayerRole.PLAYER },
      });
    }

    return this.prisma.room.findUnique({ where: { id: room.id }, include: this.roomInclude });
  }

  // A player leaving voluntarily (explicit "leave" action or a disconnect
  // that outlasted the reconnect grace period). Runs the same
  // cleanup/host-transfer logic as kickPlayer below, regardless of whether
  // the leaver happened to be the host — a room can end up truly empty via
  // several different departure orders, not just "host leaves last".
  async leaveRoom(userId: string, roomId: string): Promise<DepartureResult> {
    const membership = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) throw new NotFoundException('you are not in this room');

    await this.prisma.roomPlayer.update({
      where: { id: membership.id },
      data: { isOnline: false, leftAt: new Date() },
    });

    return this.handleDeparture(roomId, userId, membership.role);
  }

  // Host-only: forcibly remove another player. Shares the same
  // cleanup/transfer path as a voluntary leave.
  async kickPlayer(roomId: string, targetUserId: string): Promise<DepartureResult> {
    const membership = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });
    if (!membership) throw new NotFoundException('that player is not in this room');
    if (membership.role === PlayerRole.HOST) {
      throw new BadRequestException('the host cannot be kicked');
    }

    await this.prisma.roomPlayer.update({
      where: { id: membership.id },
      data: { isOnline: false, leftAt: new Date() },
    });

    return this.handleDeparture(roomId, targetUserId, membership.role);
  }

  // Shared by leaveRoom/kickPlayer: transfer the host crown if anyone else
  // is still online, or delete the room entirely (cascades to
  // RoomPlayer/Match/ChatMessage rows — see Phase 3 schema) if the
  // departing player was the last one present. Runs unconditionally, not
  // just when the departing player was host, so a room can never be left
  // stuck open with zero online players.
  private async handleDeparture(
    roomId: string,
    departingUserId: string,
    departingRole: PlayerRole,
  ): Promise<DepartureResult> {
    const nextHost = await this.prisma.roomPlayer.findFirst({
      where: { roomId, isOnline: true, userId: { not: departingUserId } },
      orderBy: { joinedAt: 'asc' },
    });

    if (nextHost) {
      if (departingRole === PlayerRole.HOST) {
        await this.prisma.$transaction([
          this.prisma.roomPlayer.update({ where: { id: nextHost.id }, data: { role: PlayerRole.HOST } }),
          this.prisma.room.update({ where: { id: roomId }, data: { hostId: nextHost.userId } }),
        ]);
        return { newHostUserId: nextHost.userId, roomDeleted: false };
      }
      return { newHostUserId: null, roomDeleted: false };
    }

    // Nobody else online — the room is empty. Delete it outright rather
    // than just marking it CLOSED, per product requirement.
    await this.prisma.room.delete({ where: { id: roomId } });
    return { newHostUserId: null, roomDeleted: true };
  }

  async setPresence(userId: string, roomId: string, isOnline: boolean) {
    const membership = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) return null;
    return this.prisma.roomPlayer.update({ where: { id: membership.id }, data: { isOnline } });
  }

  async setReady(userId: string, roomId: string, isReady: boolean) {
    const membership = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) throw new NotFoundException('you are not in this room');
    return this.prisma.roomPlayer.update({ where: { id: membership.id }, data: { isReady } });
  }

  async assertIsHost(userId: string, roomId: string) {
    const membership = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership || membership.role !== PlayerRole.HOST) {
      throw new ForbiddenException('only the host can do this');
    }
  }

  // Host-only. Max players can't drop below the number of players
  // currently occupying the room, and settings can't change once a match
  // is in progress.
  async updateRoomSettings(roomId: string, input: UpdateRoomSettingsInput) {
    const room = await this.getRoomById(roomId);
    if (room.status !== RoomStatus.LOBBY) {
      throw new BadRequestException('cannot change settings while a match is in progress');
    }
    if (input.maxPlayers !== undefined) {
      const activeCount = room.players.filter((p) => p.isOnline).length;
      if (input.maxPlayers < activeCount) {
        throw new BadRequestException(`max players cannot be lower than the ${activeCount} players currently in the room`);
      }
    }

    await this.prisma.room.update({ where: { id: roomId }, data: { ...input } });
    return this.getRoomById(roomId);
  }

  // Public list shows who's hosting, not the room's join code (the code is
  // only meaningful once you've already decided to join).
  async listPublicRooms(take = 20) {
    return this.prisma.room.findMany({
      where: { visibility: RoomVisibility.PUBLIC, status: RoomStatus.LOBBY },
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        maxPlayers: true,
        debateMode: true,
        host: { select: { username: true, avatar: true } },
        _count: { select: { players: true } },
      },
    });
  }

  async listAdminRooms() {
    return this.prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        code: true,
        status: true,
        visibility: true,
        maxPlayers: true,
        debateMode: true,
        createdAt: true,
        host: { select: { username: true } },
        players: { where: { isOnline: true }, select: { userId: true } },
      },
    });
  }

  async closeRoomByAdmin(roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, select: { id: true, code: true } });
    if (!room) throw new NotFoundException('room not found');

    await this.prisma.room.update({
      where: { id: roomId },
      data: { status: RoomStatus.CLOSED },
    });

    return { id: room.id, code: room.code };
  }

  async getRoomByCode(code: string) {
    const room = await this.prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: this.roomInclude,
    });
    if (!room) throw new NotFoundException('room not found');
    return room;
  }

  async getRoomById(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: this.roomInclude,
    });
    if (!room) throw new NotFoundException('room not found');
    return room;
  }

  async recentChatMessages(roomId: string, take = 50) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        userId: true,
        content: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    });

    return messages.reverse();
  }

  async setRoomStatus(roomId: string, status: RoomStatus) {
    return this.prisma.room.update({ where: { id: roomId }, data: { status } });
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateRoomCode();
      const existing = await this.prisma.room.findUnique({ where: { code } });
      if (!existing) return code;
    }
    throw new Error('failed to generate a unique room code, please retry');
  }

  private readonly roomInclude = {
    players: { include: { user: true }, where: { leftAt: null } },
  };
}
