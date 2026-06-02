import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TranscriptionRepository } from '../transcription.repository';
import { CacheService } from 'src/common/cache.service';
import { TRANSCRIPTION_EVENTS } from './transscibe.types';
import { Logger } from '@nestjs/common';

@Injectable()
export class TranscriptionEventsHandler {
    private readonly logger = new Logger(TranscriptionEventsHandler.name)
    constructor(
        private readonly transcriptionRepository: TranscriptionRepository,
        private readonly cacheService: CacheService,
    ) { }

    @OnEvent(TRANSCRIPTION_EVENTS.CREATED)
    async handleTranscriptionCreated(event: any) {
        const { videoUrl, cacheKey, formatted, platform, ip, userId, fromCache } = event;
        try {

            if (fromCache) {
                await Promise.all([
                    this.cacheService.sadd?.(`${cacheKey}:viewers`, userId).catch(() => null),
                    this.cacheService.del(`user:${userId}`).catch(() => null),
                ]);
                return;
            }

            const created = await this.transcriptionRepository.create({
                transcript: formatted.transcript,
                utterances: formatted.utterances,
                metadata: formatted.metadata,
                ip,
                videoUrl,
                userId,
            });

            await Promise.all([
                this.cacheService.set(
                    cacheKey,
                    { formatted, ownerId: userId, jobId: created._id || null },
                    60 * 60 * 24,
                ),
                this.cacheService.sadd?.(`${cacheKey}:viewers`, created.userId || userId).catch(() => null),
                this.cacheService.del(`user:${userId}`),
            ]);
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    @OnEvent(TRANSCRIPTION_EVENTS.FETCHED)
    async handleUserTranscriptions(event: any) {
        const { cacheKey, userTranscripts } = event;
        try {
            await this.cacheService.set(cacheKey, userTranscripts, 60 * 60 * 24)
        } catch (error) {
            this.logger.error(error)
            throw error;
        }
    }

    @OnEvent(TRANSCRIPTION_EVENTS.UPDATED)
    async handleTranscriptionUpdated(event: any) {
        const { userId } = event;
        try {
            await this.cacheService.del(`user:${userId}`);
        } catch (error) {
            this.logger.error(error)
            throw error;
        }
    }

}
