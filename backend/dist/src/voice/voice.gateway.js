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
exports.VoiceGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const class_validator_1 = require("class-validator");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const websockets_2 = require("@nestjs/websockets");
const guards_1 = require("../common/guards");
const filters_1 = require("../common/filters");
const socket_events_1 = require("../common/socket-events");
class SignalDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignalDto.prototype, "targetUserId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SignalDto.prototype, "data", void 0);
class MicStateDto {
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MicStateDto.prototype, "isMicOn", void 0);
let VoiceGateway = class VoiceGateway {
    constructor() {
        this.activeByRoom = new Map();
        this.roomByUser = new Map();
    }
    onJoin(client) {
        const { roomId, user } = this.requireRoom(client);
        const active = this.activeByRoom.get(roomId) ?? new Set();
        this.activeByRoom.set(roomId, active);
        const peerIds = [...active].filter((id) => id !== user.userId);
        client.emit(socket_events_1.SocketEvents.VOICE_ACTIVE_PEERS, { peerIds });
        active.add(user.userId);
        this.roomByUser.set(user.userId, roomId);
        client.to(roomId).emit(socket_events_1.SocketEvents.VOICE_PEER_JOINED, { userId: user.userId });
    }
    onLeave(client) {
        const { roomId, user } = this.requireRoom(client);
        this.removeFromVoice(roomId, user.userId);
        client.to(roomId).emit(socket_events_1.SocketEvents.VOICE_PEER_LEFT, { userId: user.userId });
    }
    onSignal(client, body) {
        const { user } = this.requireRoom(client);
        this.server.to(body.targetUserId).emit(socket_events_1.SocketEvents.VOICE_SIGNAL, {
            fromUserId: user.userId,
            data: body.data,
        });
    }
    onMicState(client, body) {
        const { roomId, user } = this.requireRoom(client);
        this.server.to(roomId).emit(socket_events_1.SocketEvents.VOICE_MIC_STATE, {
            userId: user.userId,
            isMicOn: body.isMicOn,
        });
    }
    handleDisconnect(client) {
        const user = client.data.user;
        if (!user)
            return;
        const roomId = this.roomByUser.get(user.userId);
        if (!roomId)
            return;
        this.removeFromVoice(roomId, user.userId);
        client.to(roomId).emit(socket_events_1.SocketEvents.VOICE_PEER_LEFT, { userId: user.userId });
    }
    removeFromVoice(roomId, userId) {
        this.activeByRoom.get(roomId)?.delete(userId);
        this.roomByUser.delete(userId);
    }
    requireRoom(client) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        if (!user || !roomId) {
            throw new websockets_2.WsException('you must join a room before using voice chat');
        }
        return { roomId, user };
    }
};
exports.VoiceGateway = VoiceGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], VoiceGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.VOICE_JOIN),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], VoiceGateway.prototype, "onJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.VOICE_LEAVE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], VoiceGateway.prototype, "onLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.VOICE_SIGNAL),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, SignalDto]),
    __metadata("design:returntype", void 0)
], VoiceGateway.prototype, "onSignal", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.VOICE_MIC_STATE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, MicStateDto]),
    __metadata("design:returntype", void 0)
], VoiceGateway.prototype, "onMicState", null);
exports.VoiceGateway = VoiceGateway = __decorate([
    (0, common_1.UseFilters)(filters_1.WsExceptionFilter),
    (0, common_1.UseGuards)(guards_1.WsJwtGuard),
    (0, websockets_1.WebSocketGateway)({ cors: true })
], VoiceGateway);
//# sourceMappingURL=voice.gateway.js.map