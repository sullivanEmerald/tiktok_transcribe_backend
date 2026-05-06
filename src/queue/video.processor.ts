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

            const data = response.data;

            console.log(`Raw FastSaver API response for job ${jobId}:`, data);

            if (!data) {
                throw new Error('Empty response from FastSaver API');
            }

            console.log(`FastSaver API response for job ${jobId}:`, data.result || data);

            const videoDownloadUrl =
                data?.result?.video ||
                data?.result?.url ||
                data?.data?.url ||
                data?.video;

            if (!videoDownloadUrl) {
                throw new Error('No downloadable video URL found');
            }

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