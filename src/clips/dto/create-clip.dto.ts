import { IsString, IsNumber, IsOptional, IsUrl, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClipDto {
    @IsUrl()
    @IsOptional()
    videoUrl?: string;

    @IsString()
    startTime: string;

    @IsString()
    endTime: string;

    @IsString()
    text: string;

    @IsString()
    platform: string;

    @IsOptional()
    @IsMongoId()
    collectionId?: string;
}
