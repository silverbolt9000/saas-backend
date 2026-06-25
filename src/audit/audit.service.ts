import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit.schema';

interface AuditLogInput {
    companyId: string;
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ip?: string;
    userAgent?: string;
}

@Injectable()
export class AuditService {
    constructor(
        @InjectModel(AuditLog.name)
        private readonly auditModel: Model<AuditLogDocument>,
    ) { }

    async log(input: AuditLogInput) {
        return this.auditModel.create({
            companyId: new Types.ObjectId(input.companyId),
            userId: new Types.ObjectId(input.userId),
            action: input.action,
            entity: input.entity,
            entityId: input.entityId
                ? new Types.ObjectId(input.entityId)
                : undefined,
            metadata: input.metadata,
            ip: input.ip,
            userAgent: input.userAgent,
        });
    }
}
