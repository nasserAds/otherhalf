import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { GameModule } from '../game/game.module';
import { LobbyService } from './lobby.service';
import { LobbyGateway } from './lobby.gateway';

@Module({
  imports: [AuthModule, RoomsModule, GameModule],
  providers: [LobbyService, LobbyGateway],
})
export class LobbyModule {}
