import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException({ status: 'error', database: 'not_configured' });
    }
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error &&
        typeof (error as { code?: unknown }).code === 'string'
          ? (error as { code: string }).code
          : 'UNKNOWN';
      console.error('Database health check failed:', {
        name: error instanceof Error ? error.name : 'UnknownError',
        code,
      });
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unavailable',
        code,
      });
    }
  }
}
