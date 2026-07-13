import { Module } from '@nestjs/common';
import { DownloaderController } from './downloader.controller';
import { DownloaderService } from './downloader.service';
import { RecaptchaService } from 'src/common/recaptcha.service';
import { BullModule } from '@nestjs/bullmq';
// import { VideoProcessor } from 'src/queue/video.processor';
// import { ProgressGateway } from 'src/gateways/progress.gateway';
import { RedisService } from 'src/common/redis.service';
import { AbuseProtectionService } from 'src/common/abuse-protection.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Download, DownloadSchema } from './schema/download.schema';
import { DownloadRepository } from './download.repository';
import { DownloaderEventsHandler } from './events/download.events';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Download.name, schema: DownloadSchema }]),
  ],
  controllers: [DownloaderController],
  providers: [DownloaderService, RecaptchaService, RedisService, AbuseProtectionService, DownloadRepository, DownloaderEventsHandler],
  exports: [DownloaderService],
})
export class DownloaderModule { }
