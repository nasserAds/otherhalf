import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
