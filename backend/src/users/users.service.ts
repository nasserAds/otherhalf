import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        xp: true,
        coins: true,
        wins: true,
        losses: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async updateUsername(userId: string, dto: UpdateUsernameDto) {
    const username = dto.username.trim();
    const existing = await this.prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('username is already taken');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        xp: true,
        coins: true,
        wins: true,
        losses: true,
      },
    });

    return {
      accessToken: this.jwtService.sign({ sub: user.id, username: user.username }),
      user,
    };
  }

  // Recent XP ledger entries — lets the client show "why did my XP change"
  // rather than just a number that jumps.
  async getXpHistory(userId: string, take = 20) {
    return this.prisma.xpTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
