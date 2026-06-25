import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
    // multi-tenant
    @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
    companyId: Types.ObjectId;

    // quem fez a ação
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    // o que aconteceu
    @Prop({ required: true })
    action: string;
    // ex: CREATE_USER, LOGIN, DELETE_COMPANY, EXPORT_DATA

    // em qual entidade
    @Prop({ required: true })
    entity: string;
    // ex: User, Company, Invoice

    // qual registro (opcional)
    @Prop({ type: Types.ObjectId })
    entityId?: Types.ObjectId;

    // dados extras (antes/depois, campos afetados, etc)
    @Prop({ type: Object })
    metadata?: Record<string, any>;

    // contexto de segurança
    @Prop()
    ip?: string;

    @Prop()
    userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
