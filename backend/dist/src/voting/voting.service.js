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
exports.VotingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VotingService = class VotingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async castVote(matchId, voterId, votedForId) {
        const match = await this.getMatchDebaters(matchId);
        if (voterId === match.debaterAId || voterId === match.debaterBId) {
            throw new common_1.BadRequestException('debaters cannot vote in their own match');
        }
        if (votedForId !== match.debaterAId && votedForId !== match.debaterBId) {
            throw new common_1.BadRequestException('you can only vote for one of the two debaters');
        }
        return this.prisma.vote.upsert({
            where: { matchId_voterId: { matchId, voterId } },
            update: { votedForId },
            create: { matchId, voterId, votedForId },
        });
    }
    async castPrediction(matchId, predictorId, predictedWinnerId) {
        const match = await this.getMatchDebaters(matchId);
        if (predictorId === match.debaterAId || predictorId === match.debaterBId) {
            throw new common_1.BadRequestException('debaters cannot predict their own match');
        }
        return this.prisma.prediction.upsert({
            where: { matchId_predictorId: { matchId, predictorId } },
            update: { predictedWinnerId },
            create: { matchId, predictorId, predictedWinnerId },
        });
    }
    async tally(matchId, debaterAId, debaterBId) {
        const votes = await this.prisma.vote.findMany({ where: { matchId } });
        const debaterAVotes = votes.filter((v) => v.votedForId === debaterAId).length;
        const debaterBVotes = votes.filter((v) => v.votedForId === debaterBId).length;
        let winnerId = null;
        let isDraw = false;
        if (debaterAVotes === debaterBVotes) {
            isDraw = true;
        }
        else {
            winnerId = debaterAVotes > debaterBVotes ? debaterAId : debaterBId;
        }
        return { debaterAVotes, debaterBVotes, winnerId, isDraw };
    }
    async resolvePredictions(matchId, winnerId) {
        const predictions = await this.prisma.prediction.findMany({ where: { matchId } });
        const correctIds = [];
        await this.prisma.$transaction(predictions.map((p) => {
            const isCorrect = winnerId !== null && p.predictedWinnerId === winnerId;
            if (isCorrect)
                correctIds.push(p.predictorId);
            return this.prisma.prediction.update({ where: { id: p.id }, data: { isCorrect } });
        }));
        return correctIds;
    }
    async getMatchDebaters(matchId) {
        const match = await this.prisma.match.findUniqueOrThrow({
            where: { id: matchId },
            select: { debaterAId: true, debaterBId: true },
        });
        return match;
    }
};
exports.VotingService = VotingService;
exports.VotingService = VotingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VotingService);
//# sourceMappingURL=voting.service.js.map