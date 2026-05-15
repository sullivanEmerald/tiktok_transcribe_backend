import { Injectable } from '@nestjs/common';
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


    // Fetch Metadata using direct call
    async fetchMetadata(videoUrl: string) {
        try {
            return await this.supadata.metadata({ url: videoUrl });
        } catch (error) {
            console.log('the error fetching metadata', error)
        }
    }

    // Fetch transcript with polling, then metadata sequentially to avoid rate limiting
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

            if ('jobId' in transcriptResult) {
                const startTime = Date.now();
                const maxWait = 60000; // 1 minute timeout
                const pollInterval = 800; // 800ms for faster polling

                while (Date.now() - startTime < maxWait) {
                    await new Promise((res) => setTimeout(res, pollInterval));
                    const job = await this.supadata.transcript.getJobStatus(transcriptResult.jobId);
                    console.log("polling job", job);

                    if (job.status === 'completed') {
                        return {
                            transcript: job?.result?.content,
                            metadata,
                        };
                    }

                    if (job.status === 'failed') {
                        throw new Error('Transcription failed');
                    }
                }

                throw new Error('The Transcription is not available now');
            }

            return {
                transcript: transcriptResult.content,
                metadata,
            };
        } catch (error) {
            console.error('Supadata error:', error);
            throw error;
        }
    }

}




