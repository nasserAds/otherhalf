import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Thin wrapper so Prisma's connection lifecycle is managed by Nest's DI
// container instead of a bare module-level singleton.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Prisma database connection established.');
    } catch (error) {
      console.error('Prisma database connection failed:', {
        name: error instanceof Error ? error.name : 'UnknownError',
        code:
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          typeof (error as { code?: unknown }).code === 'string'
            ? (error as { code: string }).code
            : 'UNKNOWN',
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
