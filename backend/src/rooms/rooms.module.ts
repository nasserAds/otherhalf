import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';

@Module({
  imports: [AuthModule], // exports JwtModule, needed by RoomsGateway
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService],
})
export class RoomsModule {}
