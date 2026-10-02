import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, AuthUser } from '../common/decorators';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, JoinRoomDto, ListPublicRoomsDto } from './dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(user.userId, dto);
  }

  @Post('join')
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinRoomDto) {
    return this.roomsService.joinRoomByCode(user.userId, dto.code);
  }

  @Get('public')
  listPublic(@Query() query: ListPublicRoomsDto) {
    return this.roomsService.listPublicRooms(query.take);
  }

  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.roomsService.getRoomByCode(code);
  }
}
