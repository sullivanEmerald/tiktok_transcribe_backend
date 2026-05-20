// transcription.service.ts
import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { CreateTranscriptionDto as CreateTranscriptionDto } from './dto/create-translate.dto';
import { TranscriptionRepository } from './transcription.repository';
import { CacheService } from 'src/common/cache.service';
import { SupadataService } from 'src/common/supadata.service';
import { formatSupadataTranscript } from 'src/common/utils/vtt-parser';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProgressGateway } from 'src/gateways/progress.gateway';
import { TRANSCRIPTION_EVENTS } from './events/transscibe.types';



@Injectable()
export class TranscriptionService {
    constructor(
        private readonly transcriptionRepository: TranscriptionRepository,
        private readonly cacheService: CacheService,
        private readonly supadataService: SupadataService,
        private readonly eventEmitter: EventEmitter2,
    ) {

    }


    private normalizeVideoUrl(url: string) {
        try {
            const parsed = new URL(url);

            // remove query params
            parsed.search = '';

            // remove trailing slash
            return parsed.toString().replace(/\/$/, '');
        } catch {
            return url;
        }
    }

    async initiateTranscription(dto: CreateTranscriptionDto, ip: string, deviceId: string) {
        const { videoUrl } = dto;
        // Validate URL and platform
        const platform = this.detectPlatform(videoUrl);

        if (!platform) {
            throw new BadRequestException('Unsupported platform');
        }

        const normalizedUrl = this.normalizeVideoUrl(videoUrl);

        const cacheKey = `transcription:${normalizedUrl}`;

        const cached = await this.cacheService.get(cacheKey);

        if (cached) {
            console.log('cached');
            return { cached: true, data: cached };
        }

        try {
            const platformData = await this.supadataService.fetchTranscriptWithMetaData(videoUrl);

            const formatted = formatSupadataTranscript(platformData);

            this.eventEmitter.emit(TRANSCRIPTION_EVENTS.CREATED, {
                videoUrl,
                cacheKey,
                formatted,
                platform,
                ip,
                deviceId

            });

            console.log('formatted', formatted)

            return { data: formatted };
        } catch (error) {
            console.error('Error initiating transcription:', error);
            const errorMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'Failed to initiate transcription. The provided URL may not be supported.';
            throw new BadRequestException(errorMessage);
        }
    }

    private detectPlatform(url: string): string | null {
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('instagram.com')) return 'instagram';
        if (url.includes('youtube.com/shorts') || url.includes('youtu.be')) return 'youtube';
        return null;
    }

    async getRecentTranscribesPerUser(deviceId: string) {
        const cacheKey = `user:${deviceId}`

        const cached = await this.cacheService.get(cacheKey);

        if (cached) {
            console.log('cached user transcriptions');
            return cached;
        }
        const userTranscripts = await this.transcriptionRepository.findByDeviceId(deviceId);

        this.eventEmitter.emit(TRANSCRIPTION_EVENTS.FETCHED, {
            cacheKey,
            userTranscripts
        });

        return userTranscripts;

    }

    async getTranscription(id: string) {
        return this.transcriptionRepository.fetchByJobId(id);
    }

    async getTranscriptionByJobId(id: string) {
        return this.transcriptionRepository.findByJobId(id);
    }

}