// dto/create-collection.dto.ts
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateCollectionDto {
    @IsString()
    @MinLength(1)
    @MaxLength(20)
    name: string;
}