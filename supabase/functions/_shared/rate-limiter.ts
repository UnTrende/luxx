// Declare Deno for TypeScript
declare const Deno: unknown;

import { getRedisClient } from './redis-client.ts';
import { logger } from '../../../src/lib/logger';

// Enhanced rate limiter with Redis support
export class RateLimiter {
  private limits = {
    'ip': { windowMs: 60000, max: 100 }, // 100 requests per minute per IP
    'user': { windowMs: 60000, max: 500 }, // 500 requests per minute per user
    'auth': { windowMs: 60000, max: 30 }, // 30 auth attempts per minute
    'booking': { windowMs: 30000, max: 5 } // 5 bookings per 30 seconds
  };

  private inMemoryCounts: Map<string, { count: number; expires: number }> = new Map();

  async check(
    identifier: string,
    type: keyof typeof this.limits,
    context: any // SafetyContext from safety-core.ts
  ): Promise<{ allowed: boolean; remaining: number; reset: Date }> {

    // Check if rate limiting is enabled
    const rateLimitingEnabled = (typeof Deno !== 'undefined' && Deno.env && Deno.env.get('FF_RATE_LIMITING') === 'true');
    if (!rateLimitingEnabled) {
      return { allowed: true, remaining: 999, reset: new Date() };
    }

    const redis = getRedisClient();
    const limit = this.limits[type];
    const key = `rate_limit:${type}:${identifier}`;
    const now = Date.now();

    try {
      if (redis) {
        // Redis implementation using atomic increment
        const count = await redis.incr(key);

        // Set expiry on first request
        if (count === 1) {
          await redis.expire(key, Math.ceil(limit.windowMs / 1000));
        }

        const remaining = Math.max(0, limit.max - count);
        const ttl = await redis.ttl(key);
        const reset = new Date(now + (ttl * 1000));

        // Log warning if nearing limit
        if (count >= limit.max * 0.8 && context?.config?.enableMonitoring) {
          await this.logRateLimitWarning(identifier, type, count, context);
        }

        return {
          allowed: count <= limit.max,
          remaining,
          reset
        };
      }
    } catch (error) {
      logger.error('RateLimiter: Redis error, falling back to memory', error, 'rate-limiter');
    }

    // Fallback: In-Memory Implementation
    return this.checkInMemory(identifier, type, limit, now, context);
  }

  private checkInMemory(
    identifier: string,
    type: string,
    limit: { windowMs: number; max: number },
    now: number,
    context: any
  ): { allowed: boolean; remaining: number; reset: Date } {
    const key = `${type}:${identifier}`;
    const record = this.inMemoryCounts.get(key);

    if (record && now < record.expires) {
      record.count++;

      if (record.count >= limit.max * 0.8 && context?.config?.enableMonitoring) {
        this.logRateLimitWarning(identifier, type, record.count, context);
      }

      return {
        allowed: record.count <= limit.max,
        remaining: Math.max(0, limit.max - record.count),
        reset: new Date(record.expires)
      };
    }

    // New window
    const expires = now + limit.windowMs;
    this.inMemoryCounts.set(key, { count: 1, expires });
    return {
      allowed: true,
      remaining: limit.max - 1,
      reset: new Date(expires)
    };
  }

  async checkMulti(
    identifiers: string[],
    type: keyof typeof this.limits,
    context: any
  ): Promise<boolean> {
    const checks = await Promise.all(
      identifiers.map(id => this.check(id, type, context))
    );
    return checks.every(check => check.allowed);
  }

  private async logRateLimitWarning(identifier: string, type: string, count: number, context: any) {
    if (context?.config?.enableMonitoring) {
      logger.warn(`Rate limit warning: ${type} ${identifier} has ${count} requests`, undefined, 'rate-limiter');
    }
  }
}