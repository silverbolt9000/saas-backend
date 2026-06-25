import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Post()
    create(@Body() dto: CreateCompanyDto, @Req() req: AuthRequest) {
        return this.companyService.create(dto, req.user.userId);
    }

    @Get('me')
    getMyCompany(@Req() req) {
        return this.companyService.getMyCompany(req.user.userId);
    }

}
