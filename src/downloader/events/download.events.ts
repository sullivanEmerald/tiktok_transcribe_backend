import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from 'src/common/cache.service';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Download, DownloadDocument } from '../schema/download.schema';
import { DOWNLOADER_EVENTS } from './downloader-events.type';

@Injectable()
export class DownloaderEventsHandler {
    private readonly logger = new Logger(DownloaderEventsHandler.name)
    constructor(
        @InjectModel(Download.name) private downloadModel: Model<DownloadDocument>,
    ) { }

    @OnEvent(DOWNLOADER_EVENTS.DOWNLOAD_CREATED)
    async handleDownloadCreated(event: any) {
        const { userId, videoUrl, title, downloadUrl, ip, source, duration, caption, thumbnail } = event;
        try {
            const download = new this.downloadModel({ userId, videoUrl, title, downloadUrl, ip, caption, thumbnail, source, duration });
            await download.save();
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }


}
