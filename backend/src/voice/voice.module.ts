import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VoiceGateway } from './voice.gateway';

@Module({
  imports: [AuthModule], // exports JwtModule, needed by WsJwtGuard
  providers: [VoiceGateway],
})
export class VoiceModule {}
