import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { CacheService } from 'src/common/cache.service';
import { UserEventsHandler } from './events/user.events';
import { DownloaderModule } from 'src/downloader/downloader.module';
import { TranslateModule } from 'src/translate/translate.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    DownloaderModule,
    TranslateModule
  ],
  controllers: [UsersController],
  providers: [UsersService, CacheService, UserEventsHandler],
  exports: [UsersService],
})
export class UsersModule { }
