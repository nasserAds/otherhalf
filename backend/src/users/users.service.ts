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
