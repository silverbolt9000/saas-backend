import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Matches } from 'class-validator';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { CompanyPlan } from './enums/company-plan';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
    @Prop({ required: true })
    name!: string;

    @Transform(({ value }) => value.replace(/\D/g, ''))
    @Matches(/^\d{14}$/)
    cnpj!: string;

    @Prop({ required: true })
    email!: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    ownerId!: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
    members!: Types.ObjectId[];

    @Prop({ default: true })
    active!: boolean;

    @Prop({ enum: CompanyPlan, default: CompanyPlan.FREE })
    plan!: CompanyPlan;

    @Prop()
    planExpiresAt?: Date;

    @Prop({ default: false })
    onboardingCompleted!: boolean;


}

export const CompanySchema = SchemaFactory.createForClass(Company);
