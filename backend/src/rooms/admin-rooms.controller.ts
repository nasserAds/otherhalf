import { Controller, Delete, Headers, HttpException, HttpStatus, Param, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Controller('admin/rooms')
export class AdminRoomsController {
  constructor(private readonly roomsService: RoomsService, private readonly roomsGateway: RoomsGateway) {}

  @Delete(':roomId')
  async closeRoom(@Param('roomId') roomId: string, @Headers('x-admin-key') adminKey?: string) {
    this.assertAdmin(adminKey);
    const result = await this.roomsService.closeRoomByAdmin(roomId);
    this.roomsGateway.notifyRoomClosed(roomId);
    return result;
  }

  private assertAdmin(adminKey?: string) {
    const configuredKey = process.env.ADMIN_SECRET;
    if (!configuredKey) throw new HttpException('admin is not configured', HttpStatus.SERVICE_UNAVAILABLE);
    if (!adminKey) throw new UnauthorizedException('invalid admin key');
    const a = Buffer.from(adminKey);
    const b = Buffer.from(configuredKey);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('invalid admin key');
  }
}
