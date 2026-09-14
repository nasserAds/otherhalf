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
exports.LobbyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LobbyService = class LobbyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveChatMessage(roomId, userId, content) {
        return this.prisma.chatMessage.create({
            data: { roomId, userId, content },
            include: { user: { select: { username: true, avatar: true } } },
        });
    }
    async recentMessages(roomId, take = 30) {
        const messages = await this.prisma.chatMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            take,
            include: { user: { select: { username: true, avatar: true } } },
        });
        return messages.reverse();
    }
};
exports.LobbyService = LobbyService;
exports.LobbyService = LobbyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LobbyService);
//# sourceMappingURL=lobby.service.js.map