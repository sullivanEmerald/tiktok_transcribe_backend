import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Supadata } from '@supadata/js';

@Injectable()
export class SupadataService {
    private readonly supadata: Supadata;

    constructor() {
        const apiKey = process.env.SD_API_KEY;

        if (!apiKey) {
            throw new Error('SD_API_KEY environment variable is required');
        }

        this.supadata = new Supadata({ apiKey });
    }

    // Fetch Metadata safely so it doesn't crash Promise.all
    async fetchMetadata(videoUrl: string) {
        try {
            return await this.supadata.metadata({
                url: videoUrl,
            });
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return null;
        }
    }

    // Fetch transcript with polling and metadata
    async fetchTranscriptWithMetaData(videoUrl: string) {
        try {
            const [transcriptResult, metadata] = await Promise.all([
                this.supadata.transcript({
                    url: videoUrl,
                    text: false,
                    mode: 'auto',
                    lang: 'en',
                }),

                this.fetchMetadata(videoUrl),
            ]);

            console.log('Supadata transcript result:', transcriptResult);

            if ('jobId' in transcriptResult) {
                const startTime = Date.now();
                const maxWait = 60000; // 1 minute timeout
                const pollInterval = 800;

                while (Date.now() - startTime < maxWait) {
                    await new Promise((res) => setTimeout(res, pollInterval));
                    const job = await this.supadata.transcript.getJobStatus(transcriptResult.jobId);

                    if (job.status === 'completed') {
                        return {
                            transcript: job?.result?.content,
                            metadata,
                        };
                    }

                    if (job.status === 'failed') {
                        const errorCode = job.error?.error;
                        const errorMessage = job.error?.message || '';

                        if (
                            errorCode === 'not-found' ||
                            errorMessage.toLowerCase().includes('private') ||
                            errorMessage.toLowerCase().includes('restricted')
                        ) {
                            throw new HttpException(
                                'No data available for this video. It may be private, removed, or restricted.',
                                HttpStatus.BAD_REQUEST,
                            );
                        }

                        throw new HttpException(
                            `Transcription failed: ${errorMessage}`,
                            HttpStatus.INTERNAL_SERVER_ERROR,
                        );
                    }
                }

                throw new HttpException(
                    'The Transcription timed out',
                    HttpStatus.REQUEST_TIMEOUT,
                );
            }

            return {
                transcript: transcriptResult.content,
                metadata,
            };
        } catch (error) {
            console.error('Supadata error:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            const errMsg = error?.message || '';

            if (
                errMsg.includes('not-found') ||
                errMsg.includes('private')
            ) {
                throw new HttpException(
                    'No data available for this video. It may be private, removed, or restricted.',
                    HttpStatus.BAD_REQUEST,
                );
            }

            throw new HttpException(
                error?.details ? 'No data available for this video. It may be private, removed, or restricted.' : 'Internal server error',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}