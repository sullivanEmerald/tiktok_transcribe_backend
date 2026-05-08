// transcription.service.ts
import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { CreateTranscriptionDto as CreateTranscriptionDto } from './dto/create-translate.dto';
import { TranscriptionRepository } from './transcription.repository';
import { CacheService } from 'src/common/cache.service';
import { SupadataService } from 'src/common/supadata.service';
import { formatSupadataTranscript } from 'src/common/utils/vtt-parser';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProgressGateway } from 'src/gateways/progress.gateway';



@Injectable()
export class TranscriptionService {
    constructor(
        private readonly transcriptionRepository: TranscriptionRepository,
        private readonly cacheService: CacheService,
        private readonly supadataService: SupadataService,
        private readonly eventEmitter: EventEmitter2,
    ) {

    }

    async initiateTranscription(dto: CreateTranscriptionDto, ip: string) {
        const { videoUrl } = dto;
        // Validate URL and platform
        const platform = this.detectPlatform(videoUrl);

        if (!platform) {
            throw new BadRequestException('Unsupported platform');
        }

        const cacheKey = `transcription:${videoUrl}`;

        const cached = await this.cacheService.get(cacheKey);

        if (cached) {
            console.log('cached');
            return { cached: true, data: cached };
        }

        try {
            const platformData = await this.supadataService.fetchTranscriptWithMetaData(videoUrl);

            const formatted = formatSupadataTranscript(platformData);

            this.eventEmitter.emit('transcription.created', {
                videoUrl,
                cacheKey,
                formatted,
                platform,
                ip,
            });

            console.log('formatted', formatted)

            return { data: formatted };
        } catch (error) {
            console.error('Error initiating transcription:', error);
            throw new BadRequestException(error.message || 'Failed to initiate transcription. The provided URL may not be supported for transcription.');
        }
    }

    private detectPlatform(url: string): string | null {
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('instagram.com')) return 'instagram';
        if (url.includes('youtube.com/shorts') || url.includes('youtu.be')) return 'youtube';
        return null;
    }

    async getRecentTranscribesForIp(ip: string) {
        return this.transcriptionRepository.findByIp(ip);
    }

    async getTranscription(id: string) {
        return this.transcriptionRepository.fetchByJobId(id);
    }

    async getTranscriptionByJobId(id: string) {
        return this.transcriptionRepository.findByJobId(id);
    }

}