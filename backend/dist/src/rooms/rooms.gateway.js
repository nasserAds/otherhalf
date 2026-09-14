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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const class_validator_1 = require("class-validator");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const rooms_service_1 = require("./rooms.service");
const socket_events_1 = require("../common/socket-events");
const filters_1 = require("../common/filters");
class JoinRoomSocketDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], JoinRoomSocketDto.prototype, "code", void 0);
const RECONNECT_GRACE_MS = 30_000;
let RoomsGateway = class RoomsGateway {
    constructor(roomsService, jwtService) {
        this.roomsService = roomsService;
        this.jwtService = jwtService;
        this.disconnectTimers = new Map();
    }
    handleConnection(client) {
        const token = client.handshake.auth?.token;
        if (!token) {
            client.disconnect(true);
            return;
        }
        try {
            const payload = this.jwtService.verify(token);
            client.data.user = { userId: payload.sub, username: payload.username };
            client.join(payload.sub);
        }
        catch {
            client.disconnect(true);
        }
    }
    async handleDisconnect(client) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        if (!user || !roomId)
            return;
        await this.roomsService.setPresence(user.userId, roomId, false);
        this.server.to(roomId).emit(socket_events_1.SocketEvents.PRESENCE_OFFLINE, { userId: user.userId });
        const key = `${roomId}:${user.userId}`;
        const timer = setTimeout(async () => {
            const result = await this.roomsService.leaveRoom(user.userId, roomId).catch(() => null);
            this.disconnectTimers.delete(key);
            if (!result)
                return;
            if (result.roomDeleted) {
                this.server.to(roomId).emit(socket_events_1.SocketEvents.ROOM_CLOSED, {});
                return;
            }
            this.server.to(roomId).emit(socket_events_1.SocketEvents.LOBBY_PLAYER_LEFT, { userId: user.userId });
            if (result.newHostUserId) {
                this.server
                    .to(roomId)
                    .emit(socket_events_1.SocketEvents.LOBBY_HOST_TRANSFERRED, { newHostUserId: result.newHostUserId });
            }
            const room = await this.roomsService.getRoomById(roomId);
            this.server.to(roomId).emit(socket_events_1.SocketEvents.ROOM_STATE_SYNC, room);
        }, RECONNECT_GRACE_MS);
        this.disconnectTimers.set(key, timer);
    }
    async onRoomJoin(client, body) {
        const user = client.data.user;
        const room = await this.roomsService.joinRoomByCode(user.userId, body.code);
        if (!room) {
            throw new common_1.NotFoundException('room not found');
        }
        const key = `${room.id}:${user.userId}`;
        const pending = this.disconnectTimers.get(key);
        if (pending) {
            clearTimeout(pending);
            this.disconnectTimers.delete(key);
        }
        client.data.roomId = room.id;
        client.join(room.id);
        this.server.to(room.id).emit(socket_events_1.SocketEvents.LOBBY_PLAYER_JOINED, {
            userId: user.userId,
            username: user.username,
        });
        this.server.to(room.id).emit(socket_events_1.SocketEvents.ROOM_STATE_SYNC, room);
        return room;
    }
    async onRoomLeave(client) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        if (!roomId)
            return;
        const result = await this.roomsService.leaveRoom(user.userId, roomId);
        client.leave(roomId);
        client.data.roomId = undefined;
        if (result.roomDeleted) {
            this.server.to(roomId).emit(socket_events_1.SocketEvents.ROOM_CLOSED, {});
            return;
        }
        this.server.to(roomId).emit(socket_events_1.SocketEvents.LOBBY_PLAYER_LEFT, { userId: user.userId });
        if (result.newHostUserId) {
            this.server
                .to(roomId)
                .emit(socket_events_1.SocketEvents.LOBBY_HOST_TRANSFERRED, { newHostUserId: result.newHostUserId });
        }
        const room = await this.roomsService.getRoomById(roomId);
        this.server.to(roomId).emit(socket_events_1.SocketEvents.ROOM_STATE_SYNC, room);
    }
};
exports.RoomsGateway = RoomsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RoomsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.ROOM_JOIN),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        JoinRoomSocketDto]),
    __metadata("design:returntype", Promise)
], RoomsGateway.prototype, "onRoomJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.ROOM_LEAVE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], RoomsGateway.prototype, "onRoomLeave", null);
exports.RoomsGateway = RoomsGateway = __decorate([
    (0, common_1.UseFilters)(filters_1.WsExceptionFilter),
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService,
        jwt_1.JwtService])
], RoomsGateway);
//# sourceMappingURL=rooms.gateway.js.map