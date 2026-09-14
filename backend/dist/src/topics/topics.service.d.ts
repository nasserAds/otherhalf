import { Topic, TopicCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class TopicsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRandomTopic(usedTopicIds: string[], category?: TopicCategory): Promise<Topic>;
    getRandomTopics(count: number, usedTopicIds: string[], category?: TopicCategory): Promise<Topic[]>;
}
