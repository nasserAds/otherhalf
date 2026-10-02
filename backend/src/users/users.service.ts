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
        profilePublic: true,
        wins: true,
        losses: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async getPublicProfile(username: string, viewerUserId?: string) {
    const normalizedUsername = username.trim();
    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        username: true,
        avatar: true,
        xp: true,
        wins: true,
        losses: true,
        profilePublic: true,
      },
    });

    if (!user) throw new NotFoundException('user not found');
    if (!user.profilePublic && user.id !== viewerUserId) {
      throw new NotFoundException('profile not found');
    }

    const matches = await this.prisma.match.findMany({
      where: {
        status: 'COMPLETED',
        OR: [{ debaterAId: user.id }, { debaterBId: user.id }],
      },
      orderBy: { endedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        topic: { select: { text: true } },
        winnerId: true,
        isDraw: true,
        endedAt: true,
        debaterAId: true,
        debaterBId: true,
      },
    });

    const votesReceived = await this.prisma.vote.count({ where: { votedForId: user.id } });
    const totalDebates = matches.length;
    const wins = user.wins;
    const losses = user.losses;
    const decidedDebates = wins + losses;
    const winRate = decidedDebates > 0 ? Math.round((wins / decidedDebates) * 100) : 0;

    let currentWinStreak = 0;
    for (const match of matches) {
      if (match.isDraw || match.winnerId === null) break;
      if (match.winnerId === user.id) currentWinStreak += 1;
      else break;
    }

    let longestWinStreak = 0;
    let streak = 0;
    for (const match of [...matches].reverse()) {
      if (!match.isDraw && match.winnerId === user.id) {
        streak += 1;
        longestWinStreak = Math.max(longestWinStreak, streak);
      } else {
        streak = 0;
      }
    }

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      level: Math.floor(user.xp / 750) + 1,
      xp: user.xp,
      wins,
      losses,
      winRate,
      totalDebates,
      votesReceived,
      currentWinStreak,
      longestWinStreak,
      profilePublic: user.profilePublic,
      matchHistory: matches.map((match) => ({
        id: match.id,
        topic: match.topic.text,
        result: match.isDraw ? 'DRAW' : match.winnerId === user.id ? 'WIN' : 'LOSS',
        endedAt: match.endedAt,
        votesReceived: 0,
      })),
    };
  }

  async updateProfilePrivacy(userId: string, profilePublic: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePublic },
      select: { profilePublic: true },
    });
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
        profilePublic: true,
        wins: true,
        losses: true,
      },
    });

    return {
      accessToken: this.jwtService.sign({ sub: user.id, username: user.username }),
      user,
    };
  }

  async adjustPlayerCurrency(username: string, action: 'add' | 'remove', xp: number, coins: number) {
    const normalizedUsername = username.trim();

    if (xp === 0 && coins === 0) {
      throw new ConflictException('xp or coins amount must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { username: normalizedUsername },
        select: { id: true, username: true, xp: true, coins: true },
      });

      if (!user) throw new NotFoundException('user not found');

      const xpDelta = action === 'add' ? xp : -xp;
      const coinDelta = action === 'add' ? coins : -coins;
      const nextXp = user.xp + xpDelta;
      const nextCoins = user.coins + coinDelta;

      if (nextXp < 0 || nextCoins < 0) {
        throw new ConflictException('cannot reduce XP or coins below zero');
      }

      const updated = await tx.user.update({
        where: { id: user.id },
        data: { xp: nextXp, coins: nextCoins },
        select: { id: true, username: true, xp: true, coins: true },
      });

      await tx.xpTransaction.create({
        data: {
          userId: user.id,
          type: 'OTHER',
          xpAmount: xpDelta,
          coinAmount: coinDelta,
        },
      });

      return {
        ...updated,
        xpDelta,
        coinDelta,
      };
    });
  }

  async deleteUserByUsername(username: string) {
    const normalizedUsername = username.trim();

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { username: normalizedUsername },
        select: { id: true, username: true },
      });

      if (!user) {
        throw new NotFoundException('user not found');
      }

      // Remove dependent records that reference User directly.
      await tx.vote.deleteMany({
        where: {
          OR: [
            { voterId: user.id },
            { votedForId: user.id },
            {
              match: {
                OR: [
                  { debaterAId: user.id },
                  { debaterBId: user.id },
                  { winnerId: user.id },
                ],
              },
            },
          ],
        },
      });

      await tx.prediction.deleteMany({
        where: {
          OR: [
            { predictorId: user.id },
            { predictedWinnerId: user.id },
            {
              match: {
                OR: [
                  { debaterAId: user.id },
                  { debaterBId: user.id },
                  { winnerId: user.id },
                ],
              },
            },
          ],
        },
      });

      await tx.xpTransaction.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            {
              match: {
                OR: [
                  { debaterAId: user.id },
                  { debaterBId: user.id },
                  { winnerId: user.id },
                ],
              },
            },
          ],
        },
      });

      await tx.round.deleteMany({
        where: { speakerId: user.id },
      });

      // Match -> Round/Vote/Prediction/XpTransaction use ON DELETE CASCADE.
      await tx.match.deleteMany({
        where: {
          OR: [
            { debaterAId: user.id },
            { debaterBId: user.id },
            { winnerId: user.id },
          ],
        },
      });

      await tx.chatMessage.deleteMany({
        where: { userId: user.id },
      });

      await tx.roomPlayer.deleteMany({
        where: { userId: user.id },
      });

      // Room -> its dependent records use ON DELETE CASCADE.
      // Deleting hosted rooms prevents the required Room.hostId FK
      // from blocking deletion of the user.
      await tx.room.deleteMany({
        where: { hostId: user.id },
      });

      await tx.user.delete({
        where: { id: user.id },
      });

      return { username: user.username };
    });
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
