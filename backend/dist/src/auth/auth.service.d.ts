import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    checkUsername(username: string): Promise<{
        available: boolean;
        valid: false;
    } | {
        available: boolean;
        valid: true;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        deviceSecret: string;
        user: {
            id: string;
            username: string;
            avatar: string;
            xp: number;
            coins: number;
            wins: number;
            losses: number;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            username: string;
            avatar: string;
            xp: number;
            coins: number;
            wins: number;
            losses: number;
        };
    }>;
    private signToken;
    private toPublicUser;
}
