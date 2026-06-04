import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DownloadDocument = Download & Document;

@Schema({ timestamps: true })
export class Download extends Document {
    @Prop({ required: true, index: true })
    guestId: string;

    @Prop({ required: true })
    videoUrl: string;

    @Prop()
    title?: string;

    @Prop()
    downloadUrl?: string;

    @Prop()
    thumbnail?: string;

    @Prop()
    source?: string;

    @Prop()
    duration?: number;

    @Prop()
    caption?: string;

    @Prop({ required: true })
    ip: string;
}

export const DownloadSchema = SchemaFactory.createForClass(Download);
