import { ExecutionContext, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
}
export declare class WsJwtGuard implements CanActivate {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    canActivate(context: ExecutionContext): boolean;
}
export {};
