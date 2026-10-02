import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { AdminRoomsController } from './admin-rooms.controller';

@Module({
  imports: [AuthModule], // exports JwtModule, needed by RoomsGateway
  controllers: [RoomsController, AdminRoomsController],
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService],
})
export class RoomsModule {}
