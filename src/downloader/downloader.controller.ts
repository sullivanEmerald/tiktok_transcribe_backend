import { Controller, Post, Body, Logger, BadRequestException, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { DownloaderService } from './downloader.service';
import { RecaptchaService } from 'src/common/recaptcha.service';
import { CreateTranscriptionDto } from '../translate/dto/create-translate.dto';
import { AbuseProtectionService } from 'src/common/abuse-protection.service';
import type { Response, Request } from 'express';
import { Res, Req } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getClientIp } from 'src/utils/getClientIp';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

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
    async downloadVideo(@Body() dto: CreateTranscriptionDto, @Req() req: Request, @Res() res: Response, @CurrentUser() user: any) {
        console.log('Download request received:', { guestId: user?.guestId });
        let ip = getClientIp(req)

        // Abuse protection check
        const abuseCheck = await this.abuseProtection.checkTranscriptionAbuse(ip);
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
        try {
            await this.downloaderService.streamVideoToClient(dto, res, user?.guestId, ip);
        } catch (error) {
            console.error('Download failed:', error.message);

            // Guard: don't double-send if streaming already started
            if (!res.headersSent) {
                res.status(502).json({
                    success: false,
                    message: error.message || 'Failed to download video',
                });
            }
        }
    }

}
