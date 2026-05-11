import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';

import {
    RateLimiterRedis,
} from 'rate-limiter-flexible';

import Redis from 'ioredis';

@Injectable()
export class AbuseProtectionService {
    private redis: Redis;

    private transcriptionLimiter: RateLimiterRedis;

    constructor() {
        this.redis = new Redis(process.env.REDIS_URL!, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });

        this.transcriptionLimiter = new RateLimiterRedis({
            storeClient: this.redis,

            keyPrefix: 'transcription-limit',

            points: 5, // 5 transcription jobs

            duration: 60, // per 60 seconds

            blockDuration: 300, // block 5 mins after abuse
        });

        this.redis.on('connect', () => {
            console.log('🟢 AbuseProtection Redis connected');
        });

        this.redis.on('error', (err) => {
            console.error('❌ AbuseProtection Redis error', err);
        });
    }

    async checkTranscriptionAbuse(ip: string) {
        try {
            const result =
                await this.transcriptionLimiter.consume(ip);

            return {
                allowed: true,
                remainingPoints: result.remainingPoints,
                msBeforeNext: result.msBeforeNext,
                requireCaptcha: false,
            };

        } catch (error) {
            const retryAfterSeconds =
                Math.ceil(error.msBeforeNext / 1000);

            const retryAfterMinutes =
                Math.ceil(retryAfterSeconds / 60);

            return {
                allowed: false,
                requireCaptcha: false,
                retryAfterMinutes,
                message: `Too many requests. Try again in ${retryAfterMinutes} minutes.`,
            };
        }
    }

    async consume(ip: string) {

        try {

            return await this.transcriptionLimiter
                .consume(ip);

        } catch (error: any) {

            const retryAfterSeconds =
                Math.ceil(error.msBeforeNext / 1000);

            const retryAfterMinutes =
                Math.ceil(retryAfterSeconds / 60);

            throw new BadRequestException({
                message:
                    `Too many requests. Try again in ${retryAfterMinutes} minutes.`,
            });
        }
    }

    async reset(ip: string) {
        await this.transcriptionLimiter.delete(ip);
    }
}