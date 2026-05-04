import { Controller, Post, Body, Logger, BadRequestException, Get, Param, NotFoundException } from '@nestjs/common';
import { DownloaderService } from './downloader.service';
import { RecaptchaService } from 'src/common/recaptcha.service';
import { CreateTranscriptionDto } from '../translate/dto/create-translate.dto';
import * as fs from 'fs';
import { AbuseProtectionService } from 'src/common/abuse-protection.service';
import type { Response, Request } from 'express';
import { Res, Req } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('downloader')
export class DownloaderController {
    private readonly logger = new Logger(DownloaderController.name);

    constructor(
        private readonly downloaderService: DownloaderService,
        private readonly recaptchaService: RecaptchaService,
        private readonly abuseProtection: AbuseProtectionService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    @Post('/download')
    async downloadVideo(@Body() dto: CreateTranscriptionDto, @Req() req: Request) {
        let ip =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.socket?.remoteAddress ||
            req.ip ||
            'unknown';

        // Abuse protection check
        const abuseCheck = await this.abuseProtection.check(ip);
        if (abuseCheck.requireCaptcha) {
            if (!dto.captchaToken) {
                throw new BadRequestException({ requireCaptcha: true, message: 'CAPTCHA token is required due to high usage' });
            }
            const captchaValid = await this.recaptchaService.verify(dto.captchaToken);
            if (!captchaValid) {
                throw new BadRequestException({ requireCaptcha: true, message: 'CAPTCHA verification failed' });
            }
            // Reset limiter after successful CAPTCHA with Emitter event
            this.eventEmitter.emit('abuseProtection.reset', { ip });
        }
        return this.downloaderService.downloadVideoOnly(dto);
    }


    @Get('download/:jobId')
    async downloadFile(@Param('jobId') jobId: string, @Res() res: Response) {
        const filePath = await this.downloaderService.getFile(jobId);

        console.log('Download request:', { jobId, filePath, exists: filePath && fs.existsSync(filePath) });

        if (!filePath || !fs.existsSync(filePath)) {
            throw new NotFoundException('File not found');
        }

        return res.download(filePath, 'clip_script.mp4', (err) => {
            if (!err) {
                // ✅ delete after successful download
                fs.unlinkSync(filePath);
                this.downloaderService.removeFile(jobId);
            }
        });
    }
}
