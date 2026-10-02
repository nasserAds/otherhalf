import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

type AnalyticsRedisClient = ReturnType<typeof createClient>;

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private client?: AnalyticsRedisClient;
  private readyPromise?: Promise<void>;

  private async getClient(): Promise<AnalyticsRedisClient | null> {
    const url = process.env.REDIS_URL ?? process.env.KV_URL;
    if (!url) return null;
    if (this.client?.isReady) return this.client;

    if (!this.client) {
      this.client = createClient({ url });
      this.client.on('error', (error) => console.error('Analytics Redis error:', error));
    }

    if (!this.readyPromise) {
      this.readyPromise = this.client.connect().then(() => undefined).catch((error) => {
        this.readyPromise = undefined;
        console.error('Analytics Redis connection failed:', error);
        throw error;
      });
    }

    try {
      await this.readyPromise;
      return this.client;
    } catch {
      return null;
    }
  }

  async recordVisit(visitorId: string) {
    const client = await this.getClient();
    if (!client) return;

    const day = new Date().toISOString().slice(0, 10);
    await Promise.all([
      client.incr('analytics:visits:total'),
      client.incr(`analytics:visits:day:${day}`),
      client.sAdd(`analytics:visitors:day:${day}`, visitorId),
      client.set(`analytics:online:${visitorId}`, '1', { EX: 90 }),
    ]);
    await client.expire(`analytics:visitors:day:${day}`, 60 * 60 * 24 * 35);
  }

  async heartbeat(visitorId: string) {
    const client = await this.getClient();
    if (!client) return;
    await client.set(`analytics:online:${visitorId}`, '1', { EX: 90 });
  }

  async getVisitStats() {
    const client = await this.getClient();
    if (!client) {
      return { totalVisits: 0, todayVisits: 0, todayUniqueVisitors: 0, onlineVisitors: 0 };
    }

    const day = new Date().toISOString().slice(0, 10);
    let onlineVisitors = 0;
    const onlineKeys = client.scanIterator({ MATCH: 'analytics:online:*', COUNT: 100 });
    for await (const _key of onlineKeys) onlineVisitors += 1;

    const [totalVisits, todayVisits, todayUniqueVisitors] = await Promise.all([
      client.get('analytics:visits:total'),
      client.get(`analytics:visits:day:${day}`),
      client.sCard(`analytics:visitors:day:${day}`),
    ]);

    return {
      totalVisits: Number(totalVisits ?? 0),
      todayVisits: Number(todayVisits ?? 0),
      todayUniqueVisitors: Number(todayUniqueVisitors ?? 0),
      onlineVisitors,
    };
  }

  async onModuleDestroy() {
    if (this.client?.isOpen) await this.client.quit();
  }
}
