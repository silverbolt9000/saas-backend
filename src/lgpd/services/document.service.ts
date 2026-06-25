import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LgpdDocument, LgpdDocumentDocument, DocumentStatus } from '../schemas/document.schema';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class DocumentService {
    constructor(
        @InjectModel(LgpdDocument.name)
        private documentModel: Model<LgpdDocumentDocument>,
        private readonly auditService: AuditService,
    ) { }

    async create(
        companyId: string,
        dto: CreateDocumentDto,
        userId: string,
    ): Promise<LgpdDocumentDocument> {
        if (!Types.ObjectId.isValid(companyId)) {
            throw new BadRequestException('Empresa inválida');
        }

        const document = new this.documentModel({
            ...dto,
            companyId: new Types.ObjectId(companyId),
            uploadedBy: new Types.ObjectId(userId),
            uploadedAt: new Date(),
        });

        const savedDocument = await document.save();

        await this.auditService.log({
            companyId,
            userId,
            action: 'CREATE_DOCUMENT',
            entity: 'LgpdDocument',
            entityId: savedDocument._id.toString(),
        });

        return savedDocument;
    }

    async findAll(
        companyId: string,
        filters?: {
            status?: DocumentStatus;
            category?: string;
            tags?: string[];
        },
    ): Promise<LgpdDocumentDocument[]> {
        if (!Types.ObjectId.isValid(companyId)) {
            throw new BadRequestException('Empresa inválida');
        }

        const query: any = {
            companyId: new Types.ObjectId(companyId),
            active: true,
        };

        if (filters?.status) {
            query.status = filters.status;
        }

        if (filters?.category) {
            query.category = filters.category;
        }

        if (filters?.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
        }

        return this.documentModel
            .find(query)
            .sort({ createdAt: -1 })
            .populate('uploadedBy', 'email name')
            .exec();
    }

    async findById(
        companyId: string,
        documentId: string,
    ): Promise<LgpdDocumentDocument> {
        if (!Types.ObjectId.isValid(documentId)) {
            throw new NotFoundException('Documento não encontrado');
        }

        if (!Types.ObjectId.isValid(companyId)) {
            throw new BadRequestException('Empresa inválida');
        }

        const document = await this.documentModel
            .findOne({
                _id: new Types.ObjectId(documentId),
                companyId: new Types.ObjectId(companyId),
                active: true,
            })
            .populate('uploadedBy', 'email name')
            .exec();

        if (!document) {
            throw new NotFoundException('Documento não encontrado');
        }

        return document;
    }

    async update(
        companyId: string,
        documentId: string,
        dto: UpdateDocumentDto,
        userId: string,
    ): Promise<LgpdDocumentDocument> {
        if (!Types.ObjectId.isValid(documentId)) {
            throw new NotFoundException('Documento não encontrado');
        }

        const document = await this.findById(companyId, documentId);

        if (!document) {
            throw new NotFoundException('Documento não encontrado');
        }

        // Incrementar versão
        const updatedDocument = await this.documentModel
            .findByIdAndUpdate(
                new Types.ObjectId(documentId),
                {
                    ...dto,
                    version: document.version + 1,
                },
                { new: true },
            )
            .populate('uploadedBy', 'email name')
            .exec();

        await this.auditService.log({
            companyId,
            userId,
            action: 'UPDATE_DOCUMENT',
            entity: 'LgpdDocument',
            entityId: documentId,
        });

        return updatedDocument!;
    }

    async delete(
        companyId: string,
        documentId: string,
        userId: string,
    ): Promise<{ success: boolean }> {
        if (!Types.ObjectId.isValid(documentId)) {
            throw new NotFoundException('Documento não encontrado');
        }

        const document = await this.findById(companyId, documentId);

        if (!document) {
            throw new NotFoundException('Documento não encontrado');
        }

        await this.documentModel
            .findByIdAndUpdate(
                new Types.ObjectId(documentId),
                { active: false },
                { new: true },
            )
            .exec();

        await this.auditService.log({
            companyId,
            userId,
            action: 'DELETE_DOCUMENT',
            entity: 'LgpdDocument',
            entityId: documentId,
        });

        return { success: true };
    }

    async findExpiring(
        companyId: string,
        daysThreshold: number = 30,
    ): Promise<LgpdDocumentDocument[]> {
        if (!Types.ObjectId.isValid(companyId)) {
            throw new BadRequestException('Empresa inválida');
        }

        const now = new Date();
        const futureDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

        return this.documentModel
            .find({
                companyId: new Types.ObjectId(companyId),
                status: { $ne: DocumentStatus.EXPIRED },
                expiresAt: {
                    $gte: now,
                    $lte: futureDate,
                },
                active: true,
            })
            .sort({ expiresAt: 1 })
            .exec();
    }

    async updateAlertStatus(
        documentId: string,
        sent: boolean = true,
    ): Promise<void> {
        if (!Types.ObjectId.isValid(documentId)) {
            throw new BadRequestException('Documento inválido');
        }

        await this.documentModel
            .findByIdAndUpdate(
                new Types.ObjectId(documentId),
                {
                    isAlertSent: sent,
                    alertSentAt: sent ? new Date() : undefined,
                },
                { new: true },
            )
            .exec();
    }

    async updateFileInfo(
        documentId: string,
        fileUrl: string,
        fileName: string,
        fileSize: number,
    ): Promise<LgpdDocumentDocument> {
        if (!Types.ObjectId.isValid(documentId)) {
            throw new BadRequestException('Documento inválido');
        }

        const updated = await this.documentModel
            .findByIdAndUpdate(
                new Types.ObjectId(documentId),
                {
                    fileUrl,
                    fileName,
                    fileSize,
                    status: DocumentStatus.ACTIVE,
                },
                { new: true },
            )
            .exec();

        if (!updated) {
            throw new NotFoundException('Documento não encontrado');
        }

        return updated;
    }

    async getDaysToExpire(expiresAt?: Date): Promise<number | null> {
        if (!expiresAt) {
            return null;
        }

        const now = new Date();
        const diffTime = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }
}
