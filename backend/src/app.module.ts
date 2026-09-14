import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TopicsModule } from './topics/topics.module';
import { RoomsModule } from './rooms/rooms.module';
import { LobbyModule } from './lobby/lobby.module';
import { GameModule } from './game/game.module';
import { VotingModule } from './voting/voting.module';
import { XpModule } from './xp/xp.module';
import { VoiceModule } from './voice/voice.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Basic global rate limiting — protects auth/room endpoints from abuse.
    // Per-route overrides can tighten this further (e.g. login attempts).
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    PrismaModule,
    AuthModule,
    UsersModule,
    TopicsModule,
    RoomsModule,
    LobbyModule,
    GameModule,
    VotingModule,
    XpModule,
    VoiceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
