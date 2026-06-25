import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LgpdDocument, LgpdDocumentDocument } from '../schemas/document.schema';
import { DocumentService } from './document.service';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../notifications/email.service';
import { UsersService } from '../../users/users.service';
import { AlertDto } from '../dto/alert.dto';

@Injectable()
export class AlertService {
    private readonly logger = new Logger(AlertService.name);

    constructor(
        @InjectModel(LgpdDocument.name)
        private documentModel: Model<LgpdDocumentDocument>,
        private readonly documentService: DocumentService,
        private readonly auditService: AuditService,
        private readonly emailService: EmailService,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Busca documentos vencendo em breve e envia alertas
     * Este método deve ser chamado por um cron job
     */
    async sendExpiringDocumentAlerts(daysThreshold: number = 30): Promise<{
        processed: number;
        sent: number;
        failed: number;
    }> {
        this.logger.log(
            `Iniciando busca de documentos vencendo em ${daysThreshold} dias`,
        );

        try {
            const now = new Date();
            const futureDate = new Date(
                now.getTime() + daysThreshold * 24 * 60 * 60 * 1000,
            );

            // Buscar documentos vencendo
            const expiringDocuments = await this.documentModel
                .find({
                    expiresAt: {
                        $gte: now,
                        $lte: futureDate,
                    },
                    isAlertSent: false,
                    active: true,
                })
                .populate('companyId')
                .populate('uploadedBy')
                .exec();

            this.logger.log(`Encontrados ${expiringDocuments.length} documentos vencendo`);

            let sent = 0;
            let failed = 0;

            for (const doc of expiringDocuments) {
                try {
                    await this.sendAlert(doc);
                    await this.documentService.updateAlertStatus(doc._id.toString(), true);
                    sent++;
                } catch (error) {
                    this.logger.error(
                        `Erro ao enviar alerta para documento ${doc._id}:`,
                        error,
                    );
                    failed++;
                }
            }

            this.logger.log(
                `Alertas processados: ${sent} enviados, ${failed} falhados`,
            );

            return {
                processed: expiringDocuments.length,
                sent,
                failed,
            };
        } catch (error) {
            this.logger.error('Erro ao processar alertas de vencimento:', error);
            throw error;
        }
    }

    /**
     * Envia alerta para um documento específico
     */
    private async sendAlert(document: LgpdDocumentDocument): Promise<void> {
        const daysToExpire = await this.documentService.getDaysToExpire(
            document.expiresAt,
        );

        const message = {
            title: `Documento vencendo: ${document.title}`,
            body: `O documento "${document.title}" vence em ${daysToExpire} dias`,
            documentId: document._id,
            companyId: document.companyId,
            expiresAt: document.expiresAt,
            daysToExpire,
        };

        this.logger.log(`Alerta enviado para documento ${document._id}:`, message);

        // Enviar email de notificação
        try {
            const user = await this.usersService.findById(
                document.uploadedBy.toString(),
                document.companyId.toString(),
            );

            if (user && user.email) {
                await this.emailService.sendDocumentExpiringAlert(
                    user.email,
                    document.title,
                    daysToExpire || 0,
                    document.expiresAt!,
                );
            }
        } catch (error) {
            this.logger.error('Erro ao enviar email de alerta:', error);
            // Não falhar o alerta se o email não for enviado
        }

        // Registrar na auditoria
        await this.auditService.log({
            companyId: document.companyId.toString(),
            userId: document.uploadedBy.toString(),
            action: 'SEND_EXPIRING_ALERT',
            entity: 'LgpdDocument',
            entityId: document._id.toString(),
        });
    }

    /**
     * Obter estatísticas de alertas por empresa
     */
    async getAlertStats(companyId: string): Promise<{
        total: number;
        sent: number;
        pending: number;
    }> {
        if (!Types.ObjectId.isValid(companyId)) {
            throw new Error('Empresa inválida');
        }

        const total = await this.documentModel.countDocuments({
            companyId: new Types.ObjectId(companyId),
            expiresAt: { $exists: true },
            active: true,
        });

        const sent = await this.documentModel.countDocuments({
            companyId: new Types.ObjectId(companyId),
            expiresAt: { $exists: true },
            isAlertSent: true,
            active: true,
        });

        const pending = total - sent;

        return { total, sent, pending };
    }

    /**
     * Resetar status de alertas (para testes ou reenvio)
     */
    async resetAlertStatus(companyId: string): Promise<{ updated: number }> {
        if (!Types.ObjectId.isValid(companyId)) {
            throw new Error('Empresa inválida');
        }

        const result = await this.documentModel.updateMany(
            {
                companyId: new Types.ObjectId(companyId),
                isAlertSent: true,
            },
            {
                isAlertSent: false,
                alertSentAt: undefined,
            },
        );

        return { updated: result.modifiedCount };
    }

    async getAlertsByCompany(companyId: string): Promise<AlertDto[]> {

        const documents = await this.documentModel
            .find({
                companyId: new Types.ObjectId(companyId),
                expiresAt: { $exists: true },
                active: true,
            })
            .sort({ expiresAt: 1 });

        const alerts: AlertDto[] = [];

        for (const doc of documents) {

            const daysToExpire =
                await this.documentService.getDaysToExpire(
                    doc.expiresAt,
                );

            let riskLevel: 'safe' | 'warning' | 'critical' = 'safe';

            if (daysToExpire! <= 7) {
                riskLevel = 'critical';
            } else if (daysToExpire! <= 15) {
                riskLevel = 'warning';
            }

            alerts.push({
                id: doc._id.toString(),
                title: doc.title,
                expiresAt: doc.expiresAt!,
                daysToExpire: daysToExpire!,
                riskLevel,
            });
        }

        return alerts;
    }

    async getCriticalCount(companyId: string): Promise<number> {
        const now = new Date();
        const criticalDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
        return this.documentModel.countDocuments({
            companyId: new Types.ObjectId(companyId),
            expiresAt: { $exists: true },
            isAlertSent: false,
            active: true,
            $and: [
                { expiresAt: { $lte: criticalDate } },
                { expiresAt: { $gte: now } }
            ]
        });
    }
}