import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards, Req, HttpCode, HttpStatus, BadRequestException, Get, Query, Patch, Param, Delete } from '@nestjs/common';
import { CreateClipDto } from './dto/create-clip.dto';
import { ClipsService } from './clips.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { QueryClipsDto } from './dto/query-clips.dto';
import { Types } from 'mongoose';
import { MoveClipDto } from './dto/move-clip.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clips')
export class ClipsController {
    constructor(private readonly clipsService: ClipsService) { }

    @Post('create')
    // @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateClipDto, @Req() req: any, @CurrentUser() userId: any) {
        console.log(dto)
        if (!userId) {
            throw new BadRequestException('Users feature. Login or Register to use this feature');
        }
        return this.clipsService.create({ ...dto }, userId);
    }

    @Get()
    async GetClipsData(@Query() query: QueryClipsDto, @CurrentUser() userId: any) {
        console.log("userID", userId)
        if (!userId) {
            throw new BadRequestException('Something went wrong. contact support');
        }
        // Build filter object only including defined values
        const filter: any = { userId: userId };
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
        console.log('user clips', clips)
        return clips;
    }


    @Patch(':id/move')
    async moveClipToCollection(@Param('id') id: string, @CurrentUser() userId: any, @Body() dto: MoveClipDto) {
        return this.clipsService.moveClipToCollection(id, userId, dto);
    }

    @Patch(':id')
    async updateClipText(@Body() dto: { text: string }, @CurrentUser() userId: any, @Param('id') id: string) {
        return this.clipsService.updateClipText(id, userId, dto);
    }

    @Delete(':id')
    async deleteClip(@Param('id') id: string, @CurrentUser() userId: any) {
        console.log(`Deleting clip ${id} for user ${userId}`);
        return this.clipsService.deleteClip(id, userId);
    }

    @Patch(':id/title')
    async updateClipTitle(@Body() dto: { title: string }, @CurrentUser() userId: any, @Param('id') id: string) {
        console.log(`Updating clip ${id} for user ${userId} with title: ${dto.title}`);
        return this.clipsService.updateClipTitle(id, userId, dto);
    }

}