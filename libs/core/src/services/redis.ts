import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache';

@Injectable()
export class RedisService {
  constructor(private readonly cacheService: CacheService) {}

  async set(
    key: string,
    value: string | Buffer | number,
    ttlSeconds?: number,
  ): Promise<'OK' | null> {
    if (typeof ttlSeconds === 'number' && Number.isFinite(ttlSeconds)) {
      return this.cacheService.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.cacheService.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.cacheService.client.get(key);
  }

  async delete(key: string): Promise<number> {
    return this.cacheService.client.del(key);
  }
}
