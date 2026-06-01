import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { CacheService } from 'src/common/cache.service';
import { UserEventsHandler } from './events/user.events';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [UsersController],
  providers: [UsersService, CacheService, UserEventsHandler],
  exports: [UsersService],
})
export class UsersModule { }
