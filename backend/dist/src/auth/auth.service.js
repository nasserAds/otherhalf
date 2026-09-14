"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const SALT_ROUNDS = 10;
const USERNAME_PATTERN = /^[\p{L}0-9_]+$/u;
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async checkUsername(username) {
        const normalizedUsername = username.trim();
        const valid = normalizedUsername.length >= 3 &&
            normalizedUsername.length <= 20 &&
            USERNAME_PATTERN.test(normalizedUsername);
        if (!valid) {
            return { available: false, valid };
        }
        const existing = await this.prisma.user.findUnique({ where: { username: normalizedUsername } });
        return { available: !existing, valid };
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (existing) {
            throw new common_1.ConflictException('username is already taken');
        }
        const deviceSecret = crypto.randomBytes(24).toString('base64url');
        const deviceSecretHash = await bcrypt.hash(deviceSecret, SALT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                avatar: dto.avatar,
                deviceSecretHash,
            },
        });
        return {
            accessToken: this.signToken(user.id, user.username),
            deviceSecret,
            user: this.toPublicUser(user),
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (!user) {
            throw new common_1.UnauthorizedException('invalid username or device secret');
        }
        const valid = await bcrypt.compare(dto.deviceSecret, user.deviceSecretHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('invalid username or device secret');
        }
        return {
            accessToken: this.signToken(user.id, user.username),
            user: this.toPublicUser(user),
        };
    }
    signToken(userId, username) {
        return this.jwtService.sign({ sub: userId, username });
    }
    toPublicUser(user) {
        const { id, username, avatar, xp, coins, wins, losses } = user;
        return { id, username, avatar, xp, coins, wins, losses };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map