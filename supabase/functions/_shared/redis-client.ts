// Declare Deno for TypeScript
declare const Deno: unknown;

import { Redis } from 'https://esm.sh/@upstash/redis@1.22.0';

class RedisClient {
    private static instance: Redis | null = null;
    private static isAvailable: boolean = false;

    static getInstance(): Redis | null {
        if (this.instance) return this.instance;

        const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
        const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

        if (!url || !token) {
            logger.warn('⚠️ UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Falling back to in-memory mode.', undefined, 'redis-client');
            this.isAvailable = false;
            return null;
        }

        try {
            this.instance = new Redis({
                url,
                token,
            });
            this.isAvailable = true;
            logger.info('✅ Redis client initialized', undefined, 'redis-client');
        } catch (error) {
            logger.error('❌ Failed to initialize Redis client:', error, 'redis-client');
            this.isAvailable = false;
        }

        return this.instance;
    }

    static isConnected(): boolean {
        return this.isAvailable;
    }
}

export const getRedisClient = () => RedisClient.getInstance();
