import { Module } from '@nestjs/common';
import { DownloaderController } from './downloader.controller';
import { DownloaderService } from './downloader.service';
import { RecaptchaService } from 'src/common/recaptcha.service';
import { BullModule } from '@nestjs/bullmq';
// import { VideoProcessor } from 'src/queue/video.processor';
import { ProgressGateway } from 'src/gateways/progress.gateway';
import { RedisService } from 'src/common/redis.service';
import { AbuseProtectionService } from 'src/common/abuse-protection.service';

@Module({
  imports: [
  ],
  controllers: [DownloaderController],
  providers: [DownloaderService, RecaptchaService, ProgressGateway, RedisService, AbuseProtectionService],
  exports: [DownloaderService],
})
export class DownloaderModule { }
