import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { ProgressGateway } from 'src/gateways/progress.gateway';
import { TranscriptionRepository } from '../translate/transcription.repository';
import { CacheService } from 'src/common/cache.service';
import { SupadataService } from 'src/common/supadata.service';
import { formatSupadataTranscript } from 'src/common/utils/vtt-parser';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('transcription')
@Injectable()
export class TranscriptionWorker {
    constructor(
        private readonly progressGateway: ProgressGateway,
        private readonly cacheService: CacheService,
        private readonly supadataService: SupadataService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    @Process('transcribe-job')
    async handleTranscription(job: Job) {
        const { videoUrl, ip, platform } = job.data;
        const jobId = job.id.toString();

        console.log(`Starting transcription job ${jobId} for URL: ${videoUrl}`);

        const cacheKey = `transcription:${videoUrl}`;

        try {
            // Emit job started event
            const platformData = await this.supadataService.fetchTranscriptWithMetaData(videoUrl);

            const formatted = formatSupadataTranscript(platformData);

            this.eventEmitter.emit('transcription.created', {
                videoUrl,
                cacheKey,
                formatted,
                platform,
                ip,
            });

            console.log('Transcription job started for video Successful', videoUrl);

            this.progressGateway.sendCompleted(jobId, formatted, 'transcribe');

            return formatted;
        } catch (err) {
            this.progressGateway.sendError(jobId, err.message, 'transcribe');
            throw err;
        }
    }
}
