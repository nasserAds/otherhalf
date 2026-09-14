import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    checkUsername(username?: string): Promise<{
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
}
