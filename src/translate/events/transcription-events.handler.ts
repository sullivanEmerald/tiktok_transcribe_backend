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
        const { videoUrl, cacheKey, formatted, platform, ip, deviceId } = event;
        try {
            await Promise.all([
                this.transcriptionRepository.create({
                    transcript: formatted.transcript,
                    utterances: formatted.utterances,
                    metadata: formatted.metadata,
                    ip,
                    videoUrl,
                    deviceId
                }),
                this.cacheService.set(cacheKey, formatted, 60 * 60 * 24), // 24 hours
            ]);
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

}
