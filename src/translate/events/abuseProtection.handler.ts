import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AbuseProtectionService } from 'src/common/abuse-protection.service';


@Injectable()
export class AbuseProtectionEventsHandler {
    constructor(
        private readonly abuseProtectionService: AbuseProtectionService,
    ) { }

    @OnEvent('abuseProtection.reset')
    async handleAbuseProtectionReset(event: any) {
        const { ip } = event;
        try {
            await this.abuseProtectionService.reset(ip);
        } catch (err) {
            console.log('Error handling abuseProtection.reset event:', err);
        }
    }

}



