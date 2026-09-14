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
exports.XpService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const REWARDS = {
    WINNER: 25,
    LOSER: 10,
    CORRECT_PREDICTION: 5,
    DRAW_PARTICIPANT: 15,
};
let XpService = class XpService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async awardMatchResults(input) {
        const awards = [];
        if (input.isDraw) {
            awards.push({ userId: input.debaterAId, xp: REWARDS.DRAW_PARTICIPANT, type: client_1.XpTransactionType.OTHER });
            awards.push({ userId: input.debaterBId, xp: REWARDS.DRAW_PARTICIPANT, type: client_1.XpTransactionType.OTHER });
        }
        else if (input.winnerId) {
            const loserId = input.winnerId === input.debaterAId ? input.debaterBId : input.debaterAId;
            awards.push({ userId: input.winnerId, xp: REWARDS.WINNER, type: client_1.XpTransactionType.MATCH_WIN });
            awards.push({ userId: loserId, xp: REWARDS.LOSER, type: client_1.XpTransactionType.MATCH_LOSS });
        }
        for (const predictorId of input.correctPredictorIds) {
            awards.push({
                userId: predictorId,
                xp: REWARDS.CORRECT_PREDICTION,
                type: client_1.XpTransactionType.CORRECT_PREDICTION,
            });
        }
        const xpByUser = {};
        for (const award of awards) {
            xpByUser[award.userId] = (xpByUser[award.userId] ?? 0) + award.xp;
        }
        await this.prisma.$transaction([
            ...awards.map((award) => this.prisma.xpTransaction.create({
                data: {
                    userId: award.userId,
                    matchId: input.matchId,
                    type: award.type,
                    xpAmount: award.xp,
                },
            })),
            ...Object.entries(xpByUser).map(([userId, xp]) => this.prisma.user.update({ where: { id: userId }, data: { xp: { increment: xp } } })),
            ...(input.isDraw
                ? []
                : input.winnerId
                    ? [
                        this.prisma.user.update({ where: { id: input.winnerId }, data: { wins: { increment: 1 } } }),
                        this.prisma.user.update({
                            where: { id: input.winnerId === input.debaterAId ? input.debaterBId : input.debaterAId },
                            data: { losses: { increment: 1 } },
                        }),
                    ]
                    : []),
        ]);
        return xpByUser;
    }
};
exports.XpService = XpService;
exports.XpService = XpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], XpService);
//# sourceMappingURL=xp.service.js.map