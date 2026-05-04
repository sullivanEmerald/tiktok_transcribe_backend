// transcription.service.ts
import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CreateTranscriptionDto as CreateTranscriptionDto } from './dto/create-translate.dto';
import { TranscriptionRepository } from './transcription.repository';
import type { Request } from 'express';
import type { Job } from 'bull';
import { CacheService } from 'src/common/cache.service';
import { SupadataService } from 'src/common/supadata.service';
import { formatSupadataTranscript } from 'src/common/utils/vtt-parser';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProgressGateway } from 'src/gateways/progress.gateway';



@Injectable()
export class TranscriptionService {
    constructor(
        @InjectQueue('transcription') private transcriptionQueue: Queue,
        private readonly transcriptionRepository: TranscriptionRepository,
        @Inject('REQUEST') private readonly request: Request,
        private readonly cacheService: CacheService,
        private readonly supadataService: SupadataService,
        private readonly eventEmitter: EventEmitter2,
        private readonly progressGateway: ProgressGateway,

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
            this.progressGateway.sendCompleted(cached, 'transcribe');
            return cached;
        }

        // Add job to Bull queue (worker will process)
        const job = await this.transcriptionQueue.add('transcribe-job', {
            videoUrl,
            ip,
            platform,
        }, {
            attempts: 3,
            backoff: 5000,
            removeOnComplete: true,
            removeOnFail: false,
        });

        // Optionally emit job queued event via WebSocket here if desired

        return { message: 'Transcription job queued', isTranscribeAvailable: true };
    }

    private detectPlatform(url: string): string | null {
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('instagram.com')) return 'instagram';
        if (url.includes('youtube.com/shorts') || url.includes('youtu.be')) return 'youtube';
        return null;
    }

    async getRecentTranscribesForIp() {
        let ip = this.request.ip || this.request.headers['x-forwarded-for'] || 'unknown';
        if (Array.isArray(ip)) ip = ip[0];
        return this.transcriptionRepository.findByIp(ip);
    }

    async getTranscription(id: string) {
        return this.transcriptionRepository.fetchByJobId(id);
    }

    async getTranscriptionByJobId(id: string) {
        return this.transcriptionRepository.findByJobId(id);
    }

}