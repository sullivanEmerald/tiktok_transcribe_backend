import { Injectable, NotFoundException } from '@nestjs/common';
import { ClipsRepository } from './clips.repository';
import { CreateClipDto } from './dto/create-clip.dto';
import { ClIPS_EVENTS } from './events/clips.events.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CLIPS_CACHE_KEYS } from './cache/clips.name';
import { CacheService } from 'src/common/cache.service';
import { Collection, ICollection } from './schema/collection.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MoveClipDto } from './dto/move-clip.dto';
import { Types } from 'mongoose';

@Injectable()
export class ClipsService {
    constructor(
        private readonly clipRepository: ClipsRepository,
        private eventEmitter: EventEmitter2,
        private cacheService: CacheService,
        @InjectModel(Collection.name) private collectionModel: Model<ICollection>,
    ) { }

    async create(data: CreateClipDto, userId: string) {
        const clip = await this.clipRepository.create(data, userId);
        this.eventEmitter.emit(ClIPS_EVENTS.CLIP_CREATED, userId);
        // Invalidate user's clips cache
        try {
            await this.cacheService.del(CLIPS_CACHE_KEYS.USER_CLIPS(userId));
        } catch (e) {
            console.warn('Failed to clear clips cache', e);
        }
        return clip;
    }

    async getClips(filter: any, pagination?: { offset?: number; limit?: number }) {
        const userId = filter.userId;
        const clips = await this.clipRepository.find(filter, pagination);
        // this.eventEmitter.emit(ClIPS_EVENTS.CLIP_FETCHED, { userId, clips });

        return clips;
    }

    async moveClipToCollection(clipId: string, userId: string, dto: MoveClipDto) {
        const clip = await this.clipRepository.findOne(clipId, userId)

        if (!clip) throw new NotFoundException('Clip not found');

        clip.collectionId = dto.collectionId ? new Types.ObjectId(dto.collectionId) : (null as unknown as Types.ObjectId);
        await clip.save();

        return clip;
    }

    async updateClipText(clipId: string, userId: string, dto: { text: string }) {
        const clip = await this.clipRepository.findOne(clipId, userId);
        if (!clip) throw new NotFoundException('Clip not found');

        clip.text = dto.text;
        await clip.save();

        return clip;
    }

    async deleteClip(clipId: string, userId: string) {
        try {
            await this.clipRepository.deleteClip(clipId, userId);
        } catch (error) {
            console.error('Error deleting clip:', error);
            throw new NotFoundException('Clip not found or could not be deleted');
        }
    }


    async updateClipTitle(clipId: string, userId: string, dto: { title: string }) {
        const clip = await this.clipRepository.findOne(clipId, userId);
        if (!clip) throw new NotFoundException('Clip not found');

        clip.title = dto.title;
        await clip.save();

        return clip;
    }
}
