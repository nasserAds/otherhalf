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
exports.TopicsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TopicsService = class TopicsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRandomTopic(usedTopicIds, category) {
        const where = {
            isActive: true,
            ...(category ? { category } : {}),
            ...(usedTopicIds.length ? { id: { notIn: usedTopicIds } } : {}),
        };
        let candidates = await this.prisma.topic.findMany({ where });
        if (candidates.length === 0) {
            candidates = await this.prisma.topic.findMany({
                where: { isActive: true, ...(category ? { category } : {}) },
            });
        }
        if (candidates.length === 0) {
            throw new common_1.InternalServerErrorException('no active topics available');
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    async getRandomTopics(count, usedTopicIds, category) {
        const where = {
            isActive: true,
            ...(category ? { category } : {}),
            ...(usedTopicIds.length ? { id: { notIn: usedTopicIds } } : {}),
        };
        let pool = await this.prisma.topic.findMany({ where });
        if (pool.length < count) {
            pool = await this.prisma.topic.findMany({ where: { isActive: true, ...(category ? { category } : {}) } });
        }
        if (pool.length === 0) {
            throw new common_1.InternalServerErrorException('no active topics available');
        }
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
};
exports.TopicsService = TopicsService;
exports.TopicsService = TopicsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TopicsService);
//# sourceMappingURL=topics.service.js.map