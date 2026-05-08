import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranslateModule } from './translate/translate.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { DownloaderModule } from './downloader/downloader.module';
import { CacheService } from './common/cache.service';
import Redis from 'ioredis';
import { EventEmitterModule } from '@nestjs/event-emitter';


@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    // cast to any to bypass type error for now
    BullModule.forRootAsync({
      useFactory: () => {
        return {
          connection: process.env.REDIS_URL
            ? {
              url: process.env.REDIS_URL,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
            }
            : {
              host: 'localhost',
              port: 6379,
              maxRetriesPerRequest: null,
            },
        };
      },
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    TranslateModule,
    DownloaderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CacheService,
  ],
  exports: [CacheService],
})
export class AppModule { }
