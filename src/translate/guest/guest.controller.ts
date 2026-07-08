// transcription.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards, BadRequestException, Headers, Put, UnauthorizedException } from '@nestjs/common';
import { TranscriptionService } from '../translate.service';
import { CreateTranscriptionDto } from '../dto/create-translate.dto';
import type { Response, Request } from 'express';
import { Res, Req } from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { RecaptchaService } from 'src/common/recaptcha.service';
import { AbuseProtectionService } from 'src/common/abuse-protection.service';
import { SupadataService } from 'src/common/supadata.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getClientIp } from 'src/utils/getClientIp';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Utterance } from 'src/common/interfaces/utterance.interface';
import { GuestService } from './guest.service';

@Controller('guest')
export class GuestController {
    constructor(
        private readonly guestService: GuestService,
        private readonly recaptchaService: RecaptchaService,
        private readonly abuseProtection: AbuseProtectionService,
    ) { }

    @Post('transcription')
    async createTranscription(@Body() dto: CreateTranscriptionDto, @Req() req: Request) {
        let ip = getClientIp(req);

        // Abuse protection check
        const abuseCheck = await this.abuseProtection.checkTranscriptionAbuse(ip);

        if (!abuseCheck.allowed) {
            throw new BadRequestException({
                requireCaptcha: false,
                message: abuseCheck?.message,
            });
        }

        if (abuseCheck.requireCaptcha) {
            if (!dto.captchaToken) {
                throw new BadRequestException({
                    requireCaptcha: true,
                    message: 'Complete the captcha to continue',
                });
            }

            const valid = await this.recaptchaService.verify(dto.captchaToken);


            if (!valid) {
                throw new BadRequestException({
                    requireCaptcha: true,
                    message: 'Invalid CAPTCHA',
                });
            }

            await this.abuseProtection.reset(ip);
        }

        return this.guestService.initiateTranscription(dto, ip);

    }

}