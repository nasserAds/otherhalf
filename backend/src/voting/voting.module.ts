import { Module } from '@nestjs/common';
import { VotingService } from './voting.service';

@Module({
  providers: [VotingService],
  exports: [VotingService],
})
export class VotingModule {}
