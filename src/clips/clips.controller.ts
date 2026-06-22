import { Controller, Post, Body, UsePipes, ValidationPipe, Req, HttpCode, HttpStatus, BadRequestException, Get, Query, Patch, Param, Delete } from '@nestjs/common';
import { CreateClipDto } from './dto/create-clip.dto';
import { ClipsService } from './clips.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { QueryClipsDto } from './dto/query-clips.dto';
import { Types } from 'mongoose';
import { MoveClipDto } from './dto/move-clip.dto';

@Controller('clips')
export class ClipsController {
    constructor(private readonly clipsService: ClipsService) { }

    @Post('create')
    // @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateClipDto, @Req() req: any, @CurrentUser() user: any) {
        console.log(dto)
        if (!user.guestId) {
            throw new BadRequestException('Something went wrong. contact support');
        }
        return this.clipsService.create({ ...dto }, user.guestId);
    }

    @Get()
    async GetClipsData(@Query() query: QueryClipsDto, @CurrentUser() user: any) {
        if (!user?.guestId) {
            throw new BadRequestException('Something went wrong. contact support');
        }


        // Build filter object only including defined values
        const filter: any = { userId: user.guestId };
        if (query.platform) filter.platform = query.platform;
        if (query.collectionId && query.collectionId !== null && query.collectionId !== '') {
            filter.collectionId = new Types.ObjectId(query.collectionId);
        } else {
            filter.collectionId = null;
        }
        if (query.search) {
            filter.$text = { $search: query.search };
        }

        const page = query.currentPage ?? 1;
        const limit = Math.min(query.limit ?? 10, 100);
        const offset = (page - 1) * limit;

        const clips = await this.clipsService.getClips(filter, { offset, limit });
        return clips;
    }

    @Patch(':id/move')
    async moveClipToCollection(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: MoveClipDto) {
        console.log(`Moving clip ${id} for user ${user.guestId} to collection ${dto.collectionId}`);
        return this.clipsService.moveClipToCollection(id, user.guestId, dto);
    }

    @Patch(':id')
    async updateClipText(@Body() dto: { text: string }, @CurrentUser() user: any, @Param('id') id: string) {
        console.log(`Updating clip ${id} for user ${user.guestId} with text: ${dto.text}`);
        return this.clipsService.updateClipText(id, user.guestId, dto);
    }

    @Delete(':id')
    async deleteClip(@Param('id') id: string, @CurrentUser() user: any) {
        console.log(`Deleting clip ${id} for user ${user.guestId}`);
        return this.clipsService.deleteClip(id, user.guestId);
    }

    @Patch(':id/title')
    async updateClipTitle(@Body() dto: { title: string }, @CurrentUser() user: any, @Param('id') id: string) {
        console.log(`Updating clip ${id} for user ${user.guestId} with title: ${dto.title}`);
        return this.clipsService.updateClipTitle(id, user.guestId, dto);
    }
}