import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
    companyId: Types.ObjectId;

    @Prop()
    refreshTokenHash?: string;

    @Prop({ default: null })
    refreshToken?: string;

    createdAt?: Date;
    updatedAt?: Date;
    @Prop()
    resetToken?: string;

    @Prop()
    resetTokenExpires?: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);
