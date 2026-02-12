// transcription.service.ts
import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CreateTranscriptionDto as CreateTranscriptionDto } from './dto/create-translate.dto';
import { TranscriptionRepository } from './transcription.repository';
import type { Request } from 'express';

@Injectable()
export class TranscriptionService {
    constructor(
        @InjectQueue('transcription') private transcriptionQueue: Queue,
        private readonly transcriptionRepository: TranscriptionRepository,
        @Inject('REQUEST') private readonly request: Request,
    ) { }

    async initiateTranscription(dto: CreateTranscriptionDto) {
        // Validate URL and platform
        const platform = this.detectPlatform(dto.videoUrl);

        if (!platform) {
            throw new BadRequestException('Unsupported platform');
        }

        // Add job to queue
        const job = await this.transcriptionQueue.add('process-video', {
            videoUrl: dto.videoUrl,
            platform,
            captchaToken: dto.captchaToken,
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: false,
            removeOnFail: false,
        });



        console.log(`Job ${job.id} added to queue for URL: ${dto.videoUrl}`);

        return {
            jobId: job.id,
            status: 'processing',
            message: 'Transcription initiated',
        };
    }

    private detectPlatform(url: string): string | null {
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('instagram.com')) return 'instagram';
        if (url.includes('youtube.com/shorts') || url.includes('youtu.be')) return 'youtube';
        return null;
    }

    async getJobStatus(jobId: string) {
        const job = await this.transcriptionQueue.getJob(jobId);

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        console.log(`Checking status for job ${job.id}`, job);

        const state = await job.getState();
        const progress = job.progress();

        return {
            jobId: job.id,
            status: state,
            progress,
        };
    }

    async getJobResult(jobId: string) {
        const job = await this.transcriptionQueue.getJob(jobId);

        if (!job) {
            throw new NotFoundException('Job not found');
        }

        const state = await job.getState();

        if (state !== 'completed') {
            throw new BadRequestException('Job not completed yet');
        }

        // Save transcript to MongoDB with IP if not already saved
        let transcriptDoc = await this.transcriptionRepository.findByJobId(jobId);
        if (!transcriptDoc) {
            let ip = this.request.ip || this.request.headers['x-forwarded-for'] || 'unknown';
            if (Array.isArray(ip)) ip = ip[0];
            transcriptDoc = await this.transcriptionRepository.create(job.returnvalue, ip, String(job.id));
        }

        console.log(`Job ${job.id} completed. Returning transcript.`);
        return {
            jobId: job.id,
            transcript: job.returnvalue,
            status: 'completed',
        };
    }

    async getRecentTranscribesForIp() {
        let ip = this.request.ip || this.request.headers['x-forwarded-for'] || 'unknown';
        if (Array.isArray(ip)) ip = ip[0];
        return this.transcriptionRepository.findByIp(ip);
    }

    async getTranscription(id: string) {
        return this.transcriptionRepository.findByJobId(id);
    }
}