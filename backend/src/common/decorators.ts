import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  userId: string;
  username: string;
}

// Works for both REST (req.user, set by JwtStrategy) and WS (socket.data.user,
// set by the gateway's connection handler / WsJwtGuard) — one decorator,
// used the same way in controllers and gateway handlers.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      return client.data.user;
    }
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
