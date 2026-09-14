import { Injectable } from '@nestjs/common';
import { XpTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const REWARDS = {
  WINNER: 25,
  LOSER: 10,
  CORRECT_PREDICTION: 5,
  DRAW_PARTICIPANT: 15, // split the difference when a match ends in a draw
} as const;

interface MatchResultInput {
  matchId: string;
  winnerId: string | null;
  isDraw: boolean;
  debaterAId: string;
  debaterBId: string;
  correctPredictorIds: string[];
}

@Injectable()
export class XpService {
  constructor(private readonly prisma: PrismaService) {}

  // Every award is written as an XpTransaction AND applied to the user's
  // denormalized counters in the same DB transaction, so the two can never
  // drift apart even if a request fails halfway through.
  async awardMatchResults(input: MatchResultInput) {
    const awards: { userId: string; xp: number; type: XpTransactionType }[] = [];

    if (input.isDraw) {
      awards.push({ userId: input.debaterAId, xp: REWARDS.DRAW_PARTICIPANT, type: XpTransactionType.OTHER });
      awards.push({ userId: input.debaterBId, xp: REWARDS.DRAW_PARTICIPANT, type: XpTransactionType.OTHER });
    } else if (input.winnerId) {
      const loserId = input.winnerId === input.debaterAId ? input.debaterBId : input.debaterAId;
      awards.push({ userId: input.winnerId, xp: REWARDS.WINNER, type: XpTransactionType.MATCH_WIN });
      awards.push({ userId: loserId, xp: REWARDS.LOSER, type: XpTransactionType.MATCH_LOSS });
    }

    for (const predictorId of input.correctPredictorIds) {
      awards.push({
        userId: predictorId,
        xp: REWARDS.CORRECT_PREDICTION,
        type: XpTransactionType.CORRECT_PREDICTION,
      });
    }

    const xpByUser: Record<string, number> = {};
    for (const award of awards) {
      xpByUser[award.userId] = (xpByUser[award.userId] ?? 0) + award.xp;
    }

    await this.prisma.$transaction([
      ...awards.map((award) =>
        this.prisma.xpTransaction.create({
          data: {
            userId: award.userId,
            matchId: input.matchId,
            type: award.type,
            xpAmount: award.xp,
          },
        }),
      ),
      ...Object.entries(xpByUser).map(([userId, xp]) =>
        this.prisma.user.update({ where: { id: userId }, data: { xp: { increment: xp } } }),
      ),
      // Win/loss counters, separate from the generic XP ledger above.
      ...(input.isDraw
        ? []
        : input.winnerId
          ? [
              this.prisma.user.update({ where: { id: input.winnerId }, data: { wins: { increment: 1 } } }),
              this.prisma.user.update({
                where: { id: input.winnerId === input.debaterAId ? input.debaterBId : input.debaterAId },
                data: { losses: { increment: 1 } },
              }),
            ]
          : []),
    ]);

    return xpByUser;
  }
}
