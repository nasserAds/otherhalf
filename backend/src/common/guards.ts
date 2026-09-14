import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

// Protects REST routes. Delegates to the 'jwt' passport strategy registered
// in AuthModule (see jwt.strategy.ts).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Protects Socket.IO gateway handlers. REST auth (passport) doesn't apply to
// the WS transport, so gateways verify the JWT themselves from the
// handshake and attach the user to `socket.data.user`.
//
// Usage: the *gateway* also verifies the token once on `handleConnection`
// (see RoomsGateway) so unauthenticated sockets are dropped immediately;
// this guard is the per-message defense-in-depth layer for any handler that
// needs the current user.
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    if (client.data?.user) return true;

    const token = client.handshake.auth?.token as string | undefined;
    if (!token) return false;

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = { userId: payload.sub, username: payload.username };
      return true;
    } catch {
      return false;
    }
  }
}
