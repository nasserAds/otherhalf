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
exports.LobbyGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const class_validator_1 = require("class-validator");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const socket_io_1 = require("socket.io");
const guards_1 = require("../common/guards");
const filters_1 = require("../common/filters");
const socket_events_1 = require("../common/socket-events");
const rooms_service_1 = require("../rooms/rooms.service");
const lobby_service_1 = require("./lobby.service");
const game_service_1 = require("../game/game.service");
const dto_1 = require("./dto");
class ReadyToggleDto {
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReadyToggleDto.prototype, "isReady", void 0);
class KickPlayerDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KickPlayerDto.prototype, "userId", void 0);
class UpdateSettingsDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(4),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], UpdateSettingsDto.prototype, "maxPlayers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.DebateMode),
    __metadata("design:type", String)
], UpdateSettingsDto.prototype, "debateMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RoomVisibility),
    __metadata("design:type", String)
], UpdateSettingsDto.prototype, "visibility", void 0);
let LobbyGateway = class LobbyGateway {
    constructor(roomsService, lobbyService, gameService) {
        this.roomsService = roomsService;
        this.lobbyService = lobbyService;
        this.gameService = gameService;
    }
    async onReadyToggle(client, body) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        await this.roomsService.setReady(user.userId, roomId, body.isReady);
        this.server.to(roomId).emit(socket_events_1.SocketEvents.LOBBY_PLAYER_READY_CHANGED, {
            userId: user.userId,
            isReady: body.isReady,
        });
    }
    async onChatMessage(client, body) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        const message = await this.lobbyService.saveChatMessage(roomId, user.userId, body.content);
        this.server.to(roomId).emit(socket_events_1.SocketEvents.LOBBY_CHAT_MESSAGE, {
            id: message.id,
            userId: user.userId,
            username: user.username,
            content: message.content,
            createdAt: message.createdAt,
        });
    }
    async onStartMatch(client) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        await this.roomsService.assertIsHost(user.userId, roomId);
        await this.gameService.startMatch(roomId, this.server);
    }
    async onKickPlayer(client, body) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        await this.roomsService.assertIsHost(user.userId, roomId);
        if (body.userId === user.userId) {
            throw new websockets_1.WsException('cannot kick yourself');
        }
        const result = await this.roomsService.kickPlayer(roomId, body.userId);
        this.server.to(body.userId).emit(socket_events_1.SocketEvents.LOBBY_KICKED, {});
        this.server.to(roomId).emit(socket_events_1.SocketEvents.LOBBY_PLAYER_LEFT, { userId: body.userId });
        if (result.newHostUserId) {
            this.server
                .to(roomId)
                .emit(socket_events_1.SocketEvents.LOBBY_HOST_TRANSFERRED, { newHostUserId: result.newHostUserId });
        }
        const room = await this.roomsService.getRoomById(roomId);
        this.server.to(roomId).emit(socket_events_1.SocketEvents.ROOM_STATE_SYNC, room);
    }
    async onUpdateSettings(client, body) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        await this.roomsService.assertIsHost(user.userId, roomId);
        if (Object.keys(body).length === 0) {
            throw new common_1.BadRequestException('no settings provided');
        }
        const room = await this.roomsService.updateRoomSettings(roomId, body);
        this.server.to(roomId).emit(socket_events_1.SocketEvents.ROOM_STATE_SYNC, room);
    }
};
exports.LobbyGateway = LobbyGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LobbyGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.LOBBY_READY_TOGGLE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        ReadyToggleDto]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "onReadyToggle", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.LOBBY_CHAT_MESSAGE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        dto_1.ChatMessageDto]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "onChatMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.LOBBY_START_MATCH),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "onStartMatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.LOBBY_KICK_PLAYER),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, KickPlayerDto]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "onKickPlayer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.LOBBY_UPDATE_SETTINGS),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, UpdateSettingsDto]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "onUpdateSettings", null);
exports.LobbyGateway = LobbyGateway = __decorate([
    (0, common_1.UseFilters)(filters_1.WsExceptionFilter),
    (0, common_1.UseGuards)(guards_1.WsJwtGuard),
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService,
        lobby_service_1.LobbyService,
        game_service_1.GameService])
], LobbyGateway);
//# sourceMappingURL=lobby.gateway.js.map