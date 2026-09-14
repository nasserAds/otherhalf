import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VotingService {
  constructor(private readonly prisma: PrismaService) {}

  async castVote(matchId: string, voterId: string, votedForId: string) {
    const match = await this.getMatchDebaters(matchId);
    if (voterId === match.debaterAId || voterId === match.debaterBId) {
      throw new BadRequestException('debaters cannot vote in their own match');
    }
    if (votedForId !== match.debaterAId && votedForId !== match.debaterBId) {
      throw new BadRequestException('you can only vote for one of the two debaters');
    }

    // Upsert: a resubmitted vote overwrites the previous one rather than
    // erroring, since the unique(matchId, voterId) constraint would
    // otherwise reject a simple "change my mind" resubmission.
    return this.prisma.vote.upsert({
      where: { matchId_voterId: { matchId, voterId } },
      update: { votedForId },
      create: { matchId, voterId, votedForId },
    });
  }

  async castPrediction(matchId: string, predictorId: string, predictedWinnerId: string) {
    const match = await this.getMatchDebaters(matchId);
    if (predictorId === match.debaterAId || predictorId === match.debaterBId) {
      throw new BadRequestException('debaters cannot predict their own match');
    }
    return this.prisma.prediction.upsert({
      where: { matchId_predictorId: { matchId, predictorId } },
      update: { predictedWinnerId },
      create: { matchId, predictorId, predictedWinnerId },
    });
  }

  // Called once by GameService when the voting phase ends. Returns the
  // tally plus a winner/draw decision (simple majority; a true tie is a
  // draw — see the open question flagged back in Phase 1).
  async tally(matchId: string, debaterAId: string, debaterBId: string) {
    const votes = await this.prisma.vote.findMany({ where: { matchId } });
    const debaterAVotes = votes.filter((v) => v.votedForId === debaterAId).length;
    const debaterBVotes = votes.filter((v) => v.votedForId === debaterBId).length;

    let winnerId: string | null = null;
    let isDraw = false;
    if (debaterAVotes === debaterBVotes) {
      isDraw = true;
    } else {
      winnerId = debaterAVotes > debaterBVotes ? debaterAId : debaterBId;
    }

    return { debaterAVotes, debaterBVotes, winnerId, isDraw };
  }

  // Marks every prediction correct/incorrect against the final result and
  // returns the list of predictors who called it right (for XP awarding).
  async resolvePredictions(matchId: string, winnerId: string | null): Promise<string[]> {
    const predictions = await this.prisma.prediction.findMany({ where: { matchId } });
    const correctIds: string[] = [];

    await this.prisma.$transaction(
      predictions.map((p) => {
        const isCorrect = winnerId !== null && p.predictedWinnerId === winnerId;
        if (isCorrect) correctIds.push(p.predictorId);
        return this.prisma.prediction.update({ where: { id: p.id }, data: { isCorrect } });
      }),
    );

    return correctIds;
  }

  private async getMatchDebaters(matchId: string) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      select: { debaterAId: true, debaterBId: true },
    });
    return match;
  }
}
