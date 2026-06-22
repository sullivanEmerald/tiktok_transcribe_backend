import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClipsService } from './clips.service';
import { ClipsRepository } from './clips.repository';
import { Clip, ClipSchema } from './schema/clip.schema';
import { CacheService } from 'src/common/cache.service';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { Collection, CollectionSchema } from './schema/collection.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Clip.name, schema: ClipSchema }]),
    MongooseModule.forFeature([{ name: Collection.name, schema: CollectionSchema }])
  ],
  providers: [ClipsService, ClipsRepository, CacheService, CollectionService],
  exports: [ClipsService],
  controllers: [CollectionController]
})
export class ClipsModule { }
