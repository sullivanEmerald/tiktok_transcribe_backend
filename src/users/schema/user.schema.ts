// users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserType {
    GUEST = 'guest',
    REGISTERED = 'registered',
}

@Schema({ timestamps: true })
export class User {
    @Prop({
        required: true,
        unique: true,
        index: true,
    })
    guestId: string;

    @Prop({
        enum: UserType,
        default: UserType.GUEST,
    })
    type: UserType;
}

export const UserSchema = SchemaFactory.createForClass(User);