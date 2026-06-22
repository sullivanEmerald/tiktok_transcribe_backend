import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ClIPS_EVENTS } from "./clips.events.type";
import { CLIPS_CACHE_KEYS } from "../cache/clips.name";
import { CacheService } from "src/common/cache.service";

@Injectable()
export class ClipsEventsHandler {
    constructor(private cacheService: CacheService) { }

    @OnEvent(ClIPS_EVENTS.CLIP_CREATED)
    handleClipCreatedEvent(payload: any) {
        console.log('Clip created:', payload);
    }

    @OnEvent(ClIPS_EVENTS.CLIP_UPDATED)
    handleClipUpdatedEvent(payload: any) {
        console.log('Clip updated:', payload);
    }

    @OnEvent(ClIPS_EVENTS.CLIP_DELETED)
    handleClipDeletedEvent(payload: any) {
        console.log('Clip deleted:', payload);
    }

    @OnEvent(ClIPS_EVENTS.CLIP_FETCHED)
    handleClipFetchedEvent(payload: any) {
        const { userId, clips } = payload;
        try {
            const cacheKey = CLIPS_CACHE_KEYS.USER_CLIPS(userId);
            this.cacheService.set(cacheKey, clips);
        } catch (error) {
            console.error('Error caching clips:', error);
            throw error;
        }
    }
}