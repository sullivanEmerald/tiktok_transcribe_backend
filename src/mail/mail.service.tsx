// mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import VerifyEmail from './templates/verify-email';

@Injectable()
export class MailService {
    private readonly resend: Resend;
    private readonly logger = new Logger(MailService.name);

    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    async sendVerificationEmail(to: string, token: string) {
        const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}&email=${encodeURIComponent(to)}`;

        try {
            await this.resend.emails.send({
                from: process.env.MAIL_FROM || 'info@useclipscript.com',
                to: to,
                subject: 'Verify your email address',
                react: <VerifyEmail verifyUrl={verifyUrl} />,
            });
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${to}: ${error.message}`);
            throw error;
        }

    }
}