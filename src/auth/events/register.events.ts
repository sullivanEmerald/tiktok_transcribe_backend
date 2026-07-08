import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from 'src/common/cache.service';
import { Logger } from '@nestjs/common';
import { REGISTER_EVENTS } from './register.type';
import { MailService } from 'src/mail/mail.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthEventsHandler {
    private readonly logger = new Logger(AuthEventsHandler.name)
    constructor(
        private readonly cacheService: CacheService,
        private readonly mailService: MailService
    ) { }

    @OnEvent(REGISTER_EVENTS.CREATED)
    async handleUserCreated(event: any) {
        const { email, token } = event;
        try {
            await this.mailService.sendVerificationEmail(email, token);
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    @OnEvent(REGISTER_EVENTS.PASSWORD_RESET_REQUESTED)
    async handlePasswordRequestCreated(event: any) {
        const { email, otp } = event;
        try {
            await this.mailService.sendOtpVerification(email, otp);
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

}
