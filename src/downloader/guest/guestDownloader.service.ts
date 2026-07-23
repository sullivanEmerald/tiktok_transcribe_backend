import { Injectable, UseGuards } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';
import { ConfigService } from '@nestjs/config';
import { DownloaderService } from '../downloader.service';
import { CreateTranscriptionDto } from 'src/translate/dto/create-translate.dto';
import type { Response, Request } from 'express';


@Injectable()
export class GuestDownloaderService {
    constructor(
        private readonly downloadService: DownloaderService,
    ) { }

    async downloadGuestVideo(dto: CreateTranscriptionDto, res: Response, ip: string) {
        return await this.downloadService.streamVideoToClient(dto, res, ip)
    }


}