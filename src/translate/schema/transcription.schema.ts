import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Utterance } from 'src/common/interfaces/utterance.interface';
import { Types } from 'mongoose';

export type Author = {
    username: string;
    displayName: string;
    avatarUrl: string;
};

export type Media = {
    thumbnailUrl: string;
};

export type Stats = {
    views: number;
    likes: number;
    comments: number;
    shares: number;
};

export type Metadata = {
    platform?: string;
    videoUrl?: string;
    description?: string;
    author: Author;
    media: Media;
    stats: Stats;
};

@Schema({ timestamps: true })
export class Transcription extends Document {
    @Prop({ required: true })
    transcript: string;

    @Prop({ default: null })
    title?: string;

    @Prop({ required: true, index: true })
    ip: string;

    @Prop({ type: Types.ObjectId, ref: 'User', index: true, default: null })
    userId: string;

    @Prop({ required: true })
    videoUrl: string;

    @Prop({
        type: {
            platform: { type: String },
            videoUrl: { type: String },
            description: { type: String },
            author: {
                username: { type: String, },
                displayName: { type: String, },
                avatarUrl: { type: String, },
            },
            media: {
                thumbnailUrl: { type: String },
            },
            stats: {
                views: { type: Number, },
                likes: { type: Number, },
                comments: { type: Number, },
                shares: { type: Number, },
            },
        },
        required: true,
    })
    metadata: Metadata;

    @Prop({
        type: [
            {
                text: { type: String, required: true },
                start: { type: Number, required: true },
                end: { type: Number, required: true },
            }
        ],
        required: false,
        default: [],
    })
    utterances?: Utterance[];
}

export const TranscriptionSchema = SchemaFactory.createForClass(Transcription);


TranscriptionSchema.index({ userId: 1, videoUrl: 1 }, { unique: true });
