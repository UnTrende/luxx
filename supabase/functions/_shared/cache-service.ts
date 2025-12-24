// Declare Deno for TypeScript
declare const Deno: unknown;

import { getRedisClient } from './redis-client.ts';
import { logger } from '../../../src/lib/logger';

// Cache service with Redis support and in-memory L1 cache
export class CacheService {
  private defaultTTL = 300; // 5 minutes
  private inMemoryCache: Map<string, { value: any; expires: number }> = new Map();

  // L1 Cache settings (Short lived in-memory)
  private l1TTL = 5; // 5 seconds

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL,
    tags: string[] = [] // Tags logic would require Sets in Redis
  ): Promise<T> {
    // Check if caching is enabled
    const cachingEnabled = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('FF_CACHE_ENABLED') === 'true');
    if (!cachingEnabled) {
      return await fetchFn();
    }

    // 1. Check L1 Memory Cache (Fastest)
    const memCached = this.getInMemoryCache(key);
    if (memCached) {
      return memCached;
    }

    const redis = getRedisClient();

    // 2. Check L2 Redis Cache (Persistent)
    if (redis) {
      try {
        const cachedValue = await redis.get(key);
        if (cachedValue) {
          await this.recordCacheHit(key);
          // Populate L1 for subsequent hot requests
          this.setInMemoryCache(key, cachedValue, this.l1TTL);
          return cachedValue as T;
        }
      } catch (err) {
        logger.error('CacheService: Redis error', err, 'cache-service');
      }
    }

    // 3. Fetch fresh data
    const data = await fetchFn();

    // 4. Store in Caches
    this.setInMemoryCache(key, data, this.l1TTL);

    if (redis) {
      try {
        await redis.set(key, data, { ex: ttl });
      } catch (err) {
        logger.error('CacheService: Redis write error', err, 'cache-service');
      }
    }

    await this.recordCacheMiss(key);
    return data;
  }

  async invalidate(pattern: string | string[]): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    for (const pat of patterns) {
      try {
        // Note: Keys scanning is expensive in Redis. Use precise keys where possible.
        // This is a simplified approach for the pattern matching requirement.
        const keys = await redis.keys(`*${pat}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.info(`Invalidated ${keys.length} keys matching ${pat}`, undefined, 'cache-service');
        }
      } catch (error) {
        logger.error('CacheService: Incomplete invalidation', error, 'cache-service');
      }
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    // Tag invalidation requires maintaining a Set of keys for each tag
    // For MVP, we will just log it. Real implementation needs: SADD tag:xyz key1
    logger.info(`[Not Implemented] Invalidate by tag: ${tag}`, undefined, 'cache-service');
  }

  private getInMemoryCache(key: string): any | null {
    const item = this.inMemoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.inMemoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  private setInMemoryCache(key: string, value: any, ttl: number): void {
    const expires = Date.now() + (ttl * 1000);
    this.inMemoryCache.set(key, { value, expires });
  }

  private async recordCacheHit(key: string): Promise<void> {
    // Log hit
    // logger.info(`Cache HIT: ${key}`, undefined, 'cache-service');
  }

  private async recordCacheMiss(key: string): Promise<void> {
    // Log miss
    // logger.info(`Cache MISS: ${key}`, undefined, 'cache-service');
  }
}