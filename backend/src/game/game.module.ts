import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { TopicsModule } from '../topics/topics.module';
import { VotingModule } from '../voting/voting.module';
import { XpModule } from '../xp/xp.module';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [AuthModule, RoomsModule, TopicsModule, VotingModule, XpModule],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}
