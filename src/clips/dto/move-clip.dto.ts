// dto/move-clip.dto.ts
import { IsMongoId, IsOptional } from 'class-validator';

export class MoveClipDto {
    @IsOptional()
    @IsMongoId()
    collectionId: string | null;
}