import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly redis: Redis;

    constructor() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is not set');
        }
        this.redis = new Redis(redisUrl);
        this.logger.log('Connected to Upstash Redis');
    }

    async get<T = any>(key: string): Promise<T | null> {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } else {
            await this.redis.set(key, JSON.stringify(value));
        }
    }


    async sadd(key: string, member: string): Promise<number> {
        return this.redis.sadd(key, member);
    }

    async sismember(key: string, member: string): Promise<number> {
        return this.redis.sismember(key, member);
    }

    async srem(key: string, member: string): Promise<number> {
        return this.redis.srem(key, member);
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }
}
