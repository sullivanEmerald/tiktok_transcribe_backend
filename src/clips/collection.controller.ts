// collection.controller.ts
import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

// @UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionController {
    constructor(private readonly collectionService: CollectionService) { }

    @Post('/create')
    create(@Req() req, @Body() dto: CreateCollectionDto, @CurrentUser() user: any) {
        if (!user.guestId) {
            throw new BadRequestException('Something went wrong. contact support');
        }
        return this.collectionService.create(user.guestId, dto);
    }

    @Get()
    findAll(@CurrentUser() user: any) {
        if (!user.guestId) {
            throw new BadRequestException('Something went wrong. contact support');
        }
        return this.collectionService.findAllForUser(user.guestId);
    }

    @Patch(':id')
    rename(@Req() req, @Param('id') id: string, @Body('name') name: string) {
        return this.collectionService.rename(req.user.id, id, name);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        return this.collectionService.remove(req.user.id, id);
    }
}