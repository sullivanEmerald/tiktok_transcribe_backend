// transcription.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards, BadRequestException, Headers, Put } from '@nestjs/common';
import { TranscriptionService } from './translate.service';
import { CreateTranscriptionDto } from './dto/create-translate.dto';
import type { Response, Request } from 'express';
import { Res, Req } from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { RecaptchaService } from '../common/recaptcha.service';
import { AbuseProtectionService } from '../common/abuse-protection.service';
import { SupadataService } from 'src/common/supadata.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getClientIp } from 'src/utils/getClientIp';

@Controller('transcription')
export class TranscriptionController {
    constructor(
        private readonly transcriptionService: TranscriptionService,
        private readonly recaptchaService: RecaptchaService,
        private readonly abuseProtection: AbuseProtectionService,
        private readonly supadataService: SupadataService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    @Post()
    async createTranscription(@Body() dto: CreateTranscriptionDto, @Req() req: Request, @Headers('x-device-id') deviceId: string,) {


        let ip = getClientIp(req);

        if (!deviceId) {
            throw new BadRequestException('Something went wrong. contact support');
        }

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

        return this.transcriptionService.initiateTranscription(dto, ip, deviceId);

    }


    @Get('/recent')
    async getRecentTranscribesPerUser(@Req() req: Request, @Headers('x-device-id') deviceId: string,) {
        if (!deviceId) {
            throw new BadRequestException('Something went wrong. contact support');
        }
        const result = await this.transcriptionService.getRecentTranscribesPerUser(deviceId);
        return result;
    }

    @Get(':id')
    async getTranscription(@Param('id') id: string) {
        console.log('Fetching transcription for job ID:', id);
        const result = await this.transcriptionService.getTranscription(id);
        console.log('Fetched transcription for job ID:', id, 'Result:', result);
        return result;
    }

    @Put(':id/rename')
    async renameTranscription(@Param('id') id: string, @Body() dto: { newName: string }, @Headers('x-device-id') deviceId: string,) {
        return this.transcriptionService.renameTranscription(id, dto.newName, deviceId);
    }

    @Get(':jobId/download')
    async downloadVideo(
        @Param('jobId') jobId: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        console.log('Download request for job ID:', jobId, 'from IP:', req.ip);
        // Validate job ownership by IP
        const transcription = await this.transcriptionService.getTranscriptionByJobId(jobId);
        console.log('Transcription lookup result:', transcription);
        const videoPath = join(__dirname, '../../tmp', `${jobId}.mp4`);
        console.log('Resolved video path:', videoPath);
        const fileExists = existsSync(videoPath);
        console.log('File exists:', fileExists);
        if (!transcription) {
            return res.status(404).json({ message: 'Transcription not found.' });
        }
        // Optionally check IP
        // if (transcription.ip !== req.ip) {
        //     return res.status(403).json({ message: 'Unauthorized to download this video.' });
        // }
        // Locate video file
        if (!fileExists) {
            return res.status(404).json({ message: 'Video file not found.' });
        }
        // Stream video file
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="video_${jobId}.mp4"`);
        const stream = createReadStream(videoPath);
        stream.pipe(res);
    }
}