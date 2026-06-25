import { Body, Controller, Get, Post, Req, UseGuards, Delete, Param, Patch } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AuthRequest } from '../auth/auth-request.interface';


@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(Role.ADMIN)
    create(@Body() dto: CreateUserDto, @Req() req: AuthRequest) {
        return this.usersService.create(dto, req.user.companyId);
    }

    @Get()
    @Roles(Role.ADMIN)
    findAll(@Req() req: AuthRequest) {
        console.log('REQ.USER =>', req.user);
        return this.usersService.findAllByCompany(req.user.companyId);
    }

    @Get('me')
    getMe(@Req() req: AuthRequest) {
        return this.usersService.findById(req.user.userId, req.user.companyId);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    anonymize(
        @Param('id') id: string,
        @Req() req: AuthRequest,
    ) {
        return this.usersService.anonymize(id, req.user.companyId);
    }

    @Patch(':id/password')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async changePassword(
        @Param('id') id: string,
        @Body() body: { newPassword: string }
    ) {
        return this.usersService.changePassword(id, body.newPassword);
    }


}
