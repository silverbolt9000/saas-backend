import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { PLAN_LIMITS } from '../billing/plan-limits';
import { CompanyService } from '../company/company.service';

@Injectable()
export class LgpdService {
    constructor(
        private readonly usersService: UsersService,
        private readonly auditService: AuditService,
        private readonly companyService: CompanyService,
    ) { }

    async exportUserData(
        targetUserId: string,
        requester: { userId: string; companyId: string },
    ) {
        const company = await this.companyService.findById(requester.companyId);

        if (!company) {
            throw new NotFoundException('Empresa não encontrada');
        }

        if (!PLAN_LIMITS[company.plan].canExportData) {
            throw new ForbiddenException(
                'Exportação não disponível no seu plano',
            );
        }


        const user = await this.usersService.findById(
            targetUserId,
            requester.companyId,
        );

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        await this.auditService.log({
            companyId: requester.companyId,
            userId: requester.userId,
            action: 'EXPORT_USER_DATA',
            entity: 'User',
            entityId: targetUserId,
        });

        return {
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        };
    }

    async anonymizeUser(
        targetUserId: string,
        requester: { userId: string; companyId: string },
    ) {
        const user = await this.usersService.anonymize(
            targetUserId,
            requester.companyId,
        );

        await this.auditService.log({
            companyId: requester.companyId,
            userId: requester.userId,
            action: 'ANONYMIZE_USER',
            entity: 'User',
            entityId: targetUserId,
        });

        return { success: true };
    }

    async deleteUser(
        targetUserId: string,
        requester: { userId: string; companyId: string },
    ) {
        await this.usersService.delete(
            targetUserId,
            requester.companyId,
        );

        await this.auditService.log({
            companyId: requester.companyId,
            userId: requester.userId,
            action: 'DELETE_USER',
            entity: 'User',
            entityId: targetUserId,
        });

        return { success: true };
    }
}
