import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type ClipDocument = HydratedDocument<Clip>;

@Schema({ timestamps: true })
export class Clip {
    @Prop({ type: String, required: true })
    videoUrl: string;

    @Prop({ type: Types.ObjectId, ref: 'Collection', default: null, index: true })
    collectionId: Types.ObjectId;

    @Prop({ type: String, required: true })
    startTime: string;

    @Prop({ type: String, index: true, default: '' })
    title?: string;

    @Prop({ type: String, required: true, index: true })
    platform: string;

    @Prop({ type: String, required: true })
    endTime: string;

    @Prop({ type: String })
    text?: string;

    @Prop({ type: String })
    videoTitle?: string;

    @Prop({ ref: 'User', index: true })
    userId: string;
}
export const ClipSchema = SchemaFactory.createForClass(Clip);
ClipSchema.index({ text: 'text', videoUrl: 'text' });
