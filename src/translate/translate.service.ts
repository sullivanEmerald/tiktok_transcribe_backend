// transcription.service.ts
import { Injectable, BadRequestException, NotFoundException, Inject, HttpStatus } from '@nestjs/common';
import { CreateTranscriptionDto as CreateTranscriptionDto } from './dto/create-translate.dto';
import { TranscriptionRepository } from './transcription.repository';
import { CacheService } from 'src/common/cache.service';
import { SupadataService } from 'src/common/supadata.service';
import { formatSupadataTranscript } from 'src/common/utils/vtt-parser';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProgressGateway } from 'src/gateways/progress.gateway';
import { TRANSCRIPTION_EVENTS } from './events/transscibe.types';
import { from } from 'rxjs';
import { Utterance } from 'src/common/interfaces/utterance.interface';
import { ClaudeService } from 'src/common/claudeService';


@Injectable()
export class TranscriptionService {
    constructor(
        private readonly transcriptionRepository: TranscriptionRepository,
        private readonly cacheService: CacheService,
        private readonly supadataService: SupadataService,
        private readonly eventEmitter: EventEmitter2,
        private readonly claudeService: ClaudeService,
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

    async initiateTranscription(dto: CreateTranscriptionDto, ip: string, userId: string) {
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

            const ownerId = cached?.ownerId;
            const formatted = cached?.formatted;

                if (ownerId === userId) {
                    return { cached: true, data: { ...formatted, videoUrl: cached.videoUrl } };
                }

                const viewersKey = `${cacheKey}:viewers`;

                const existingForUser = await this.transcriptionRepository.findByUserAndVideo(userId, normalizedUrl);

                if (existingForUser) {
                    console.log('DB entry already exists for this user and video, ensuring viewers set is updated');
                    // ensure viewers set contains this user (best-effort)
                    try { await this.cacheService.sadd?.(viewersKey, userId); } catch (e) { /* non-fatal */ }

                    return { cached: true, data: { ...formatted, videoUrl: normalizedUrl } };
                }

                const added = await this.cacheService.sadd?.(viewersKey, userId);

                if (added === 1) {
                    console.log('added to viewers set, creating DB entry');
                    const created = await this.transcriptionRepository.create({
                        transcript: formatted.transcript,
                        utterances: formatted.utterances,
                        metadata: formatted.metadata,
                        ip,
                        videoUrl: normalizedUrl,
                        userId,
                    });
                    this.eventEmitter.emit(TRANSCRIPTION_EVENTS.CREATED, {
                        videoUrl: normalizedUrl,
                        cacheKey,
                        formatted,
                        platform,
                        ip,
                        userId,
                        jobId: created._id,
                        fromCache: true,
                    });
                } else {
                    // someone else likely created the DB row — re-check and emit to sync frontend
                    const maybe = await this.transcriptionRepository.findByUserAndVideo(userId, normalizedUrl);
                    this.eventEmitter.emit(TRANSCRIPTION_EVENTS.CREATED, {
                        videoUrl: normalizedUrl,
                        cacheKey,
                        formatted,
                        platform,
                        ip,
                        userId,
                        jobId: maybe?._id,
                        fromCache: true,
                    });
                }
            


            return { cached: true, data: { ...formatted, videoUrl: normalizedUrl } };
        }

        try {
            const platformData = await this.supadataService.fetchTranscriptWithMetaData(videoUrl);

            const formatted = formatSupadataTranscript(platformData);

            console.log("formatted", formatted)

            this.eventEmitter.emit(TRANSCRIPTION_EVENTS.CREATED, {
                videoUrl: normalizedUrl,
                cacheKey,
                formatted,
                platform,
                ip,
                userId
            });

            console.log('Transcription initiated successfully for video', videoUrl);

            return { data: { ...formatted, videoUrl: normalizedUrl } };
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
        if (url.includes('facebook.com')) return 'facebook';
        if (url.includes('youtube.com/shorts') || url.includes('youtu.be')) return 'youtube';
        return null;
    }

    async getRecentTranscribesPerUser(userId: string) {
        const cacheKey = `user:${userId}`

        const cached = await this.cacheService.get(cacheKey);

        if (cached) {
            console.log('cached user transcriptions');
            return cached;
        }
        const userTranscripts = await this.transcriptionRepository.findByUserId(userId);

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

    async renameTranscription(id: string, newName: string, userId: string) {
        const transcription = await this.transcriptionRepository.fetchByJobId(id);

        if (!transcription) {
            throw new NotFoundException('Transcription not found');
        }

        transcription.title = newName;

        await transcription.save();

        this.eventEmitter.emit(TRANSCRIPTION_EVENTS.UPDATED, {
            userId
        });

        return HttpStatus.OK;
    }

    private cacheSummary(utterances: Utterance[]) {
        return `improved:${JSON.stringify(utterances)}`;
    }

    async improveTranscription(utterances: Utterance[], userId: string) {
        const cachedKey = this.cacheSummary(utterances);

        const cached = await this.cacheService.get(cachedKey);
        if (cached) {
            console.log('cached summary');
            return cached;
        }

        // Call to external service for summarization
        const improvedTranscript = await this.claudeService.improveTranscription(utterances);

        this.eventEmitter.emit(TRANSCRIPTION_EVENTS.EXTRACTED, {
            utterances,
            // summary,
            userId,
            cachedKey
        });

        return {
            utterances,
            improvedTranscript
            // summary
        };
    }

}