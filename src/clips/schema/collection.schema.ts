// schemas/collection.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CollectionDocument = HydratedDocument<Collection>;
export type ICollection = CollectionDocument;

@Schema({ timestamps: true })
export class Collection {
    @Prop({ type: String, ref: 'User', required: true, index: true })
    userId: string;

    @Prop({ required: true, trim: true, maxlength: 20, lowercase: true })
    name: string;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });