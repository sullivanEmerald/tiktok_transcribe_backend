// transcription.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { TranscriptionService } from './translate.service';
import { CreateTranscriptionDto } from './dto/create-translate.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('transcription')
export class TranscriptionController {
    constructor(
        private readonly transcriptionService: TranscriptionService,
        private readonly configService: ConfigService,
    ) { }

    private async verifyRecaptcha(token: string): Promise<boolean> {
        const secret = this.configService.get<string>('RECAPTCHA_SECRET');
        if (!secret) throw new Error('reCAPTCHA secret not configured');
        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret,
                    response: token,
                },
            },
        );
        return response.data.success;
    }

    @Post()
    async createTranscription(@Body() dto: CreateTranscriptionDto) {
        // CAPTCHA validation placeholder
        if (!dto.captchaToken) {
            throw new BadRequestException('CAPTCHA token is required');
        }
        const captchaValid = await this.verifyRecaptcha(dto.captchaToken);
        console.log('the verification result', captchaValid)
        if (!captchaValid) {
            throw new BadRequestException('CAPTCHA verification failed');
        }
        return this.transcriptionService.initiateTranscription(dto);
    }

    @Get(':jobId/status')
    async getStatus(@Param('jobId') jobId: string) {
        return this.transcriptionService.getJobStatus(jobId);
    }

    @Get(':jobId/result')
    async getResult(@Param('jobId') jobId: string) {
        return this.transcriptionService.getJobResult(jobId);
    }

    @Get('/recent')
    async getRecentTranscribesForIp() {
        console.log('Fetching recent transcriptions for IP');
        return this.transcriptionService.getRecentTranscribesForIp();
    }
}