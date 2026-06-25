import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DocumentCategory {
    PRIVACY_POLICY = 'PRIVACY_POLICY',
    TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
    DATA_PROCESSING = 'DATA_PROCESSING',
    CONSENT_FORM = 'CONSENT_FORM',
    DATA_RETENTION = 'DATA_RETENTION',
    INCIDENT_REPORT = 'INCIDENT_REPORT',
    AUDIT_LOG = 'AUDIT_LOG',
    OTHER = 'OTHER',
}

export enum DocumentStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    ARCHIVED = 'ARCHIVED',
}

export type LgpdDocumentDocument = LgpdDocument & Document;

@Schema({ timestamps: true })
export class LgpdDocument {
    @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
    companyId!: Types.ObjectId;

    @Prop({ required: true })
    title!: string;

    @Prop()
    description?: string;

    @Prop({ enum: DocumentCategory, default: DocumentCategory.OTHER })
    category!: DocumentCategory;

    @Prop({ enum: DocumentStatus, default: DocumentStatus.DRAFT })
    status!: DocumentStatus;

    @Prop()
    fileUrl?: string;

    @Prop()
    fileName?: string;

    @Prop()
    fileSize?: number;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    uploadedBy!: Types.ObjectId;

    @Prop({ default: () => new Date() })
    uploadedAt!: Date;

    @Prop()
    expiresAt?: Date;

    @Prop({ default: 0 })
    version!: number;

    @Prop({ type: [String], default: [] })
    tags!: string[];

    @Prop({ default: false })
    isAlertSent!: boolean;

    @Prop()
    alertSentAt?: Date;

    @Prop({ default: true })
    active!: boolean;
}

export const LgpdDocumentSchema = SchemaFactory.createForClass(LgpdDocument);

// Índices para melhor performance
LgpdDocumentSchema.index({ companyId: 1, status: 1 });
LgpdDocumentSchema.index({ companyId: 1, expiresAt: 1 });
LgpdDocumentSchema.index({ companyId: 1, category: 1 });
LgpdDocumentSchema.index({ expiresAt: 1, isAlertSent: 1 });
