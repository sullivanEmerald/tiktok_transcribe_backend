import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from 'src/common/cache.service';
import { Logger } from '@nestjs/common';
import { USER_EVENTS } from './user.events-type';
import { User, UserDocument } from '../schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserEventsHandler {
    private readonly logger = new Logger(UserEventsHandler.name)
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly cacheService: CacheService,
    ) { }

    @OnEvent(USER_EVENTS.FETCHED)
    async handleUserFetched(event: any) {
        const { cacheKey, user } = event;
        try {
            await this.cacheService.set(cacheKey, user);
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    @OnEvent(USER_EVENTS.CREATED)
    async handleUserCreated(event: any) {
        const { cacheKey, user } = event;
        try {
            await this.cacheService.set(cacheKey, user);
        } catch (err) {
            this.logger.error(err);
            throw err;
        }

    }
}
