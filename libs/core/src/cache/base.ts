import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigType, getConfigToken } from '@nestjs/config';
import cacheConfig from '@config/cache';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  client: Redis;

  constructor(
    @Inject(getConfigToken('cache'))
    private readonly cache: ConfigType<typeof cacheConfig>,
  ) {
    this.client = new Redis({
      host: this.cache.host,
      port: this.cache.port,
      username: this.cache.username || undefined,
      password: this.cache.password || undefined,
      db: this.cache.db,
      keyPrefix: this.cache.keyPrefix ? `${this.cache.keyPrefix}::` : undefined,
    });
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch (err) {
      console.log(err);
    }
  }
}
