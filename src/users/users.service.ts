import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserType } from './schema/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from 'src/common/cache.service';
import { USER_EVENTS } from './events/user.events-type';


@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private cacheService: CacheService,
        private emitter: EventEmitter2
    ) { }

    private userCachedKey = (guestId: string) => `guest:${guestId}`;


    async createGuestUser(guestId: string) {
        const newUser = await this.userModel.create({ guestId, type: UserType.GUEST });
        this.emitter.emit(USER_EVENTS.CREATED, { cacheKey: this.userCachedKey(guestId), user: newUser });
        return newUser;
    }


    async findByGuestId(guestId: string) {
        const cacheKey = this.userCachedKey(guestId);
        const cachedUser = await this.cacheService.get(cacheKey);
        if (cachedUser) {
            console.log('cache hit for user', cacheKey);
            return cachedUser;
        }

        const user = await this.userModel.findOne({ guestId });

        if (user) {
            this.emitter.emit(USER_EVENTS.FETCHED, { cacheKey, user });
        }

        return user;
    }
}
