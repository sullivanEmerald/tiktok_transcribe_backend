import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Transcription extends Document {
    @Prop({ required: true })
    transcript: string;

    @Prop({ required: true })
    ip: string;

    @Prop({ required: true })
    jobId: string;
}

export const TranscriptionSchema = SchemaFactory.createForClass(Transcription);
