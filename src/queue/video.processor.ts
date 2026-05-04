import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { ProgressGateway } from 'src/gateways/progress.gateway';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Processor('video-download')
export class VideoProcessor {
    constructor(
        private readonly configService: ConfigService,
        private readonly progressGateway: ProgressGateway
    ) { }

    @Process('download-job')
    async handleDownload(job: Job) {
        const { videoUrl, jobId } = job.data;

        console.log(`Starting FastSaver job ${jobId} for URL: ${videoUrl}`);

        try {
            // 🔵 Step 1: emit start progress
            // this.progressGateway.emitProgress(jobId, 10);

            // ⚡ Step 2: call FastSaver API
            const response = await axios.get(
                'https://api.fastsaver.io/v1/fetch',
                {
                    params: {
                        url: videoUrl,
                    },
                    headers: {
                        'X-Api-Key': this.configService.get<string>('FASTSAVER_API_KEY'),
                    },
                }
            );

            // this.progressGateway.emitProgress(jobId, 60);

            const data = response.data;

            if (!data) {
                throw new Error('Empty response from FastSaver API');
            }

            console.log(`FastSaver API response for job ${jobId}:`, data.result || data);

            // 🔍 Step 3: extract video URL (API responses vary)
            const videoDownloadUrl =
                data?.result?.video ||
                data?.result?.url ||
                data?.data?.url ||
                data?.video;

            if (!videoDownloadUrl) {
                throw new Error('No downloadable video URL found');
            }

            // this.progressGateway.emitProgress(jobId, 90);

            // ✅ Step 4: complete job
            // this.progressGateway.emitCompleted(jobId, {
            //     videoUrl: videoDownloadUrl,
            //     title: data?.result?.title || null,
            //     thumbnail: data?.result?.thumbnail || null,
            // });

            return {
                success: true,
                videoUrl: videoDownloadUrl,
            };
        } catch (error) {
            console.error('FastSaver download failed:', error);

            // this.progressGateway.emitError(
            //     jobId,
            //     'Failed to download video'
            // );

            throw error;
        }
    }
}