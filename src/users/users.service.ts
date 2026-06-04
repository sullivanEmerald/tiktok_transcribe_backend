import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserType } from './schema/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from 'src/common/cache.service';
import { USER_EVENTS } from './events/user.events-type';
import { DownloaderService } from 'src/downloader/downloader.service';
import { TranscriptionService } from 'src/translate/translate.service';


@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private cacheService: CacheService,
        private emitter: EventEmitter2,
        private downloaderService: DownloaderService,
        private transcriptionService: TranscriptionService
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

    async getProfile(guestId: string) {
        const [downloads, transcriptions] = await Promise.all([
            this.downloaderService.getDownloadsByGuestId(guestId),
            this.transcriptionService.getRecentTranscribesPerUser(guestId)
        ]);
        console.log('Profile data fetched for guestId:', guestId, { downloadsCount: downloads.length, transcriptionsCount: transcriptions.length });

        const total = downloads.length + transcriptions.length;
        // Return percentages (0-100) with two decimals
        const successfulTranscriptionRate = total
            ? Number(((transcriptions.length / total) * 100).toFixed(2))
            : 0;
        const successfulDownloadRate = total
            ? Number(((downloads.length / total) * 100).toFixed(2))
            : 0;

        return {
            statistics: {
                totalDownloads: downloads.length,
                totalTranscriptions: transcriptions.length,
                totalEngagements: downloads.length + transcriptions.length,
                successfulTranscriptionRate,
                // successfulDownloadRate,
            },
            downloads,
            transcriptions
        };
    }
}
