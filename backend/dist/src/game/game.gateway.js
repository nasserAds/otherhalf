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
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const class_validator_1 = require("class-validator");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const guards_1 = require("../common/guards");
const filters_1 = require("../common/filters");
const socket_events_1 = require("../common/socket-events");
const game_service_1 = require("./game.service");
const voting_service_1 = require("../voting/voting.service");
const dto_1 = require("../voting/dto");
class SubmitTurnDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitTurnDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], SubmitTurnDto.prototype, "content", void 0);
class ReactDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReactDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 8),
    __metadata("design:type", String)
], ReactDto.prototype, "emoji", void 0);
class TopicVoteDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TopicVoteDto.prototype, "topicId", void 0);
let GameGateway = class GameGateway {
    constructor(gameService, votingService) {
        this.gameService = gameService;
        this.votingService = votingService;
    }
    onTopicVoteCast(client, body) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        this.gameService.castTopicVote(roomId, user.userId, body.topicId, this.server);
    }
    async onTurnSubmitted(client, body) {
        const user = client.data.user;
        const roomId = client.data.roomId;
        const round = await this.gameService.submitTurn(body.matchId, user.userId, body.content);
        this.server.to(roomId).emit(socket_events_1.SocketEvents.GAME_TURN_SUBMITTED, {
            matchId: body.matchId,
            speakerId: user.userId,
            content: round.content,
        });
    }
    async onReact(client, body) {
        const roomId = client.data.roomId;
        this.server.to(roomId).emit(socket_events_1.SocketEvents.AUDIENCE_REACT, {
            matchId: body.matchId,
            emoji: body.emoji,
            userId: client.data.user.userId,
        });
    }
    async onPredict(client, body) {
        const user = client.data.user;
        await this.votingService.castPrediction(body.matchId, user.userId, body.predictedWinnerId);
        client.emit(socket_events_1.SocketEvents.AUDIENCE_PREDICT, { matchId: body.matchId, accepted: true });
    }
    async onCastVote(client, body) {
        const user = client.data.user;
        await this.votingService.castVote(body.matchId, user.userId, body.votedForId);
        client.emit(socket_events_1.SocketEvents.VOTING_CAST_VOTE, { matchId: body.matchId, accepted: true });
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.GAME_TOPIC_VOTE_CAST),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, TopicVoteDto]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "onTopicVoteCast", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.GAME_TURN_SUBMITTED),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, SubmitTurnDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "onTurnSubmitted", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.AUDIENCE_REACT),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, ReactDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "onReact", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.AUDIENCE_PREDICT),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, dto_1.PredictDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "onPredict", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(socket_events_1.SocketEvents.VOTING_CAST_VOTE),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, dto_1.CastVoteDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "onCastVote", null);
exports.GameGateway = GameGateway = __decorate([
    (0, common_1.UseFilters)(filters_1.WsExceptionFilter),
    (0, common_1.UseGuards)(guards_1.WsJwtGuard),
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __metadata("design:paramtypes", [game_service_1.GameService,
        voting_service_1.VotingService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map