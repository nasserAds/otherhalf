import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { IsString, Length } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { AnalyticsService } from './analytics.service';

class VisitDto { @IsString() @Length(8, 128) visitorId!: string; }

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService, private readonly prisma: PrismaService, private readonly roomsService: RoomsService) {}

  @Post('visit') recordVisit(@Body() dto: VisitDto) { return this.analytics.recordVisit(dto.visitorId); }
  @Post('heartbeat') heartbeat(@Body() dto: VisitDto) { return this.analytics.heartbeat(dto.visitorId); }

  @Get('admin')
  async adminStats(@Headers('x-admin-key') adminKey?: string) {
    this.assertAdmin(adminKey);
    const [traffic, users, totalMatches, activeGames, rooms] = await Promise.all([
      this.analytics.getVisitStats(),
      this.prisma.user.count(),
      this.prisma.match.count(),
      this.prisma.match.count({ where: { status: { not: 'COMPLETED' } } }),
      this.roomsService.listAdminRooms(),
    ]);
    return { traffic, users, totalMatches, activeGames, rooms };
  }

  private assertAdmin(adminKey?: string) {
    const configuredKey = process.env.ADMIN_SECRET;
    if (!configuredKey) throw new HttpException('admin is not configured', HttpStatus.SERVICE_UNAVAILABLE);
    if (!adminKey) throw new UnauthorizedException('invalid admin key');
    const a = Buffer.from(adminKey); const b = Buffer.from(configuredKey);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('invalid admin key');
  }
}