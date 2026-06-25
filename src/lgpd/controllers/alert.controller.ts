import {
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
    Query,
} from '@nestjs/common';
import { AlertService } from '../services/alert.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { AuthRequest } from '../../auth/auth-request.interface';

@Controller('lgpd/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertController {
    constructor(private readonly alertService: AlertService) { }

    /**
     * Obter estatísticas de alertas da empresa
     */
    @Get('stats')
    @Roles(Role.ADMIN)
    async getStats(@Req() req: AuthRequest) {
        return this.alertService.getAlertStats(req.user.companyId);
    }

    /**
     * Enviar alertas de vencimento (admin only)
     * Pode ser chamado manualmente ou por um cron job
     */
    @Post('send-expiring')
    @Roles(Role.ADMIN)
    async sendExpiringAlerts(@Query('days') days: string = '30') {
        const daysThreshold = parseInt(days, 10) || 30;
        return this.alertService.sendExpiringDocumentAlerts(daysThreshold);
    }

    /**
     * Resetar status de alertas (para testes)
     */
    @Post('reset-status')
    @Roles(Role.ADMIN)
    async resetAlertStatus(@Req() req: AuthRequest) {
        return this.alertService.resetAlertStatus(req.user.companyId);
    }

    @Get('list')
    async getAlerts(@Req() req) {
        return this.alertService.getAlertsByCompany(
            req.user.companyId,
        );
    }

    @Get('critical-count')
    async getCriticalCount(@Req() req) {
        const count =
            await this.alertService.getCriticalCount(
                req.user.companyId,
            );

        return {
            count,
        };
    }

    //count documents
}
