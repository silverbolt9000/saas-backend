import {
    Controller,
    Post,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';

import { LgpdService } from './lgpd.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AuthRequest } from '../auth/auth-request.interface';

@Controller('lgpd')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class LgpdController {
    constructor(private readonly lgpdService: LgpdService) { }

    @Post('export/user/:id')
    exportUser(
        @Param('id') id: string,
        @Req() req: AuthRequest,
    ) {
        return this.lgpdService.exportUserData(id, req.user);
    }

    @Post('anonymize/user/:id')
    anonymizeUser(
        @Param('id') id: string,
        @Req() req: AuthRequest,
    ) {
        return this.lgpdService.anonymizeUser(id, req.user);
    }

    @Post('delete/user/:id')
    deleteUser(
        @Param('id') id: string,
        @Req() req: AuthRequest,
    ) {
        return this.lgpdService.deleteUser(id, req.user);
    }
}
