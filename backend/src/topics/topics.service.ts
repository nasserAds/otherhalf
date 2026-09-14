import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Topic, TopicCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  // Avoids repeating a topic within the same room until the bank is
  // exhausted (per Phase 1 spec), then reshuffles automatically since the
  // `usedTopicIds` filter simply stops excluding anything once every active
  // topic has been used.
  async getRandomTopic(usedTopicIds: string[], category?: TopicCategory): Promise<Topic> {
    const where = {
      isActive: true,
      ...(category ? { category } : {}),
      ...(usedTopicIds.length ? { id: { notIn: usedTopicIds } } : {}),
    };

    let candidates = await this.prisma.topic.findMany({ where });

    // Bank exhausted for this room — reshuffle by dropping the exclusion.
    if (candidates.length === 0) {
      candidates = await this.prisma.topic.findMany({
        where: { isActive: true, ...(category ? { category } : {}) },
      });
    }

    if (candidates.length === 0) {
      throw new InternalServerErrorException('no active topics available');
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Draws `count` *distinct* topics for the pre-match topic-vote — same
  // no-repeat-until-exhausted rule as getRandomTopic, just returning a small
  // batch instead of one pick.
  async getRandomTopics(count: number, usedTopicIds: string[], category?: TopicCategory): Promise<Topic[]> {
    const where = {
      isActive: true,
      ...(category ? { category } : {}),
      ...(usedTopicIds.length ? { id: { notIn: usedTopicIds } } : {}),
    };

    let pool = await this.prisma.topic.findMany({ where });
    if (pool.length < count) {
      pool = await this.prisma.topic.findMany({ where: { isActive: true, ...(category ? { category } : {}) } });
    }
    if (pool.length === 0) {
      throw new InternalServerErrorException('no active topics available');
    }

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}
