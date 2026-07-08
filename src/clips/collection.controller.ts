// collection.controller.ts
import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionController {
    constructor(private readonly collectionService: CollectionService) { }

    @Post('/create')
    create(@Req() req, @Body() dto: CreateCollectionDto, @CurrentUser() userId: any) {
        if (!userId) {
            throw new BadRequestException('Something went wrong. contact support');
        }
        return this.collectionService.create(userId, dto);
    }

    @Get()
    findAll(@CurrentUser() userId: any) {
        if (!userId) {
            throw new BadRequestException('Something went wrong. contact support');
        }
        return this.collectionService.findAllForUser(userId);
    }

    @Patch(':id')
    rename(@Req() req, @Param('id') id: string, @CurrentUser() userId: string, @Body('name') name: string) {
        return this.collectionService.rename(userId, id, name);
    }

    @Delete(':id')
    remove(@Req() req, @CurrentUser() userId: string, @Param('id') id: string) {
        return this.collectionService.remove(userId, id);
    }
}