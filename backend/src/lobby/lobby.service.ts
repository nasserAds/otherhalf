import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LobbyService {
  constructor(private readonly prisma: PrismaService) {}

  async saveChatMessage(roomId: string, userId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { roomId, userId, content },
      include: { user: { select: { username: true, avatar: true } } },
    });
  }

  async recentMessages(roomId: string, take = 30) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { username: true, avatar: true } } },
    });
    return messages.reverse();
  }
}
