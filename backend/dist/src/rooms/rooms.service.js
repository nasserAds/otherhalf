"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const room_code_util_1 = require("../common/room-code.util");
const MAX_CODE_ATTEMPTS = 5;
let RoomsService = class RoomsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.roomInclude = {
            players: { include: { user: true }, where: { leftAt: null } },
        };
    }
    async createRoom(hostId, dto) {
        const code = await this.generateUniqueCode();
        return this.prisma.room.create({
            data: {
                code,
                hostId,
                maxPlayers: dto.maxPlayers,
                debateMode: dto.debateMode,
                visibility: dto.visibility,
                players: {
                    create: { userId: hostId, role: client_1.PlayerRole.HOST, isReady: true },
                },
            },
            include: this.roomInclude,
        });
    }
    async joinRoomByCode(userId, code) {
        const room = await this.prisma.room.findUnique({
            where: { code: code.toUpperCase() },
            include: this.roomInclude,
        });
        if (!room)
            throw new common_1.NotFoundException('room not found');
        if (room.status !== client_1.RoomStatus.LOBBY) {
            throw new common_1.BadRequestException('this room is not accepting new players right now');
        }
        const existingMembership = await this.prisma.roomPlayer.findUnique({
            where: { roomId_userId: { roomId: room.id, userId } },
        });
        if (existingMembership) {
            await this.prisma.roomPlayer.update({
                where: { id: existingMembership.id },
                data: {
                    isOnline: true,
                    leftAt: null,
                    role: room.hostId === userId ? client_1.PlayerRole.HOST : client_1.PlayerRole.PLAYER,
                },
            });
        }
        else {
            const activePlayerCount = room.players.filter((p) => p.leftAt === null).length;
            if (activePlayerCount >= room.maxPlayers) {
                throw new common_1.BadRequestException('room is full');
            }
            await this.prisma.roomPlayer.create({
                data: { roomId: room.id, userId, role: client_1.PlayerRole.PLAYER },
            });
        }
        return this.prisma.room.findUnique({ where: { id: room.id }, include: this.roomInclude });
    }
    async leaveRoom(userId, roomId) {
        const membership = await this.prisma.roomPlayer.findUnique({
            where: { roomId_userId: { roomId, userId } },
        });
        if (!membership)
            throw new common_1.NotFoundException('you are not in this room');
        await this.prisma.roomPlayer.update({
            where: { id: membership.id },
            data: { isOnline: false, leftAt: new Date() },
        });
        return this.handleDeparture(roomId, userId, membership.role);
    }
    async kickPlayer(roomId, targetUserId) {
        const membership = await this.prisma.roomPlayer.findUnique({
            where: { roomId_userId: { roomId, userId: targetUserId } },
        });
        if (!membership)
            throw new common_1.NotFoundException('that player is not in this room');
        if (membership.role === client_1.PlayerRole.HOST) {
            throw new common_1.BadRequestException('the host cannot be kicked');
        }
        await this.prisma.roomPlayer.update({
            where: { id: membership.id },
            data: { isOnline: false, leftAt: new Date() },
        });
        return this.handleDeparture(roomId, targetUserId, membership.role);
    }
    async handleDeparture(roomId, departingUserId, departingRole) {
        const nextHost = await this.prisma.roomPlayer.findFirst({
            where: { roomId, isOnline: true, userId: { not: departingUserId } },
            orderBy: { joinedAt: 'asc' },
        });
        if (nextHost) {
            if (departingRole === client_1.PlayerRole.HOST) {
                await this.prisma.$transaction([
                    this.prisma.roomPlayer.update({ where: { id: nextHost.id }, data: { role: client_1.PlayerRole.HOST } }),
                    this.prisma.room.update({ where: { id: roomId }, data: { hostId: nextHost.userId } }),
                ]);
                return { newHostUserId: nextHost.userId, roomDeleted: false };
            }
            return { newHostUserId: null, roomDeleted: false };
        }
        await this.prisma.room.delete({ where: { id: roomId } });
        return { newHostUserId: null, roomDeleted: true };
    }
    async setPresence(userId, roomId, isOnline) {
        const membership = await this.prisma.roomPlayer.findUnique({
            where: { roomId_userId: { roomId, userId } },
        });
        if (!membership)
            return null;
        return this.prisma.roomPlayer.update({ where: { id: membership.id }, data: { isOnline } });
    }
    async setReady(userId, roomId, isReady) {
        const membership = await this.prisma.roomPlayer.findUnique({
            where: { roomId_userId: { roomId, userId } },
        });
        if (!membership)
            throw new common_1.NotFoundException('you are not in this room');
        return this.prisma.roomPlayer.update({ where: { id: membership.id }, data: { isReady } });
    }
    async assertIsHost(userId, roomId) {
        const membership = await this.prisma.roomPlayer.findUnique({
            where: { roomId_userId: { roomId, userId } },
        });
        if (!membership || membership.role !== client_1.PlayerRole.HOST) {
            throw new common_1.ForbiddenException('only the host can do this');
        }
    }
    async updateRoomSettings(roomId, input) {
        const room = await this.getRoomById(roomId);
        if (room.status !== client_1.RoomStatus.LOBBY) {
            throw new common_1.BadRequestException('cannot change settings while a match is in progress');
        }
        if (input.maxPlayers !== undefined) {
            const activeCount = room.players.filter((p) => p.isOnline).length;
            if (input.maxPlayers < activeCount) {
                throw new common_1.BadRequestException(`max players cannot be lower than the ${activeCount} players currently in the room`);
            }
        }
        await this.prisma.room.update({ where: { id: roomId }, data: { ...input } });
        return this.getRoomById(roomId);
    }
    async listPublicRooms(take = 20) {
        return this.prisma.room.findMany({
            where: { visibility: client_1.RoomVisibility.PUBLIC, status: client_1.RoomStatus.LOBBY },
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
    async getRoomByCode(code) {
        const room = await this.prisma.room.findUnique({
            where: { code: code.toUpperCase() },
            include: this.roomInclude,
        });
        if (!room)
            throw new common_1.NotFoundException('room not found');
        return room;
    }
    async getRoomById(roomId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: this.roomInclude,
        });
        if (!room)
            throw new common_1.NotFoundException('room not found');
        return room;
    }
    async recentChatMessages(roomId, take = 50) {
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
    async setRoomStatus(roomId, status) {
        return this.prisma.room.update({ where: { id: roomId }, data: { status } });
    }
    async generateUniqueCode() {
        for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            const code = (0, room_code_util_1.generateRoomCode)();
            const existing = await this.prisma.room.findUnique({ where: { code } });
            if (!existing)
                return code;
        }
        throw new Error('failed to generate a unique room code, please retry');
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map