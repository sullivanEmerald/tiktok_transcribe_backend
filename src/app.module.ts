import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranslateModule } from './translate/translate.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      ttl: 60, // fallback to 'ttl' for backward compatibility
      limit: 10, // 10 requests per minute per IP
    } as any), // cast to any to bypass type error for now
    BullModule.forRoot({
      // Redis config (default localhost:6379)
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    TranslateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
