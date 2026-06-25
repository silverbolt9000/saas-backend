import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Req,
    UseGuards,
    Query,
} from '@nestjs/common';
import { DocumentService } from '../services/document.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AuthRequest } from '../../auth/auth-request.interface';
import { DocumentStatus } from '../schemas/document.schema';

@Controller('lgpd/documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
    constructor(private readonly documentService: DocumentService) { }

    @Post()
    async create(
        @Body() dto: CreateDocumentDto,
        @Req() req: AuthRequest,
    ) {
        return this.documentService.create(
            req.user.companyId,
            dto,
            req.user.userId,
        );
    }

    @Get()
    async findAll(
        @Req() req: AuthRequest,
        @Query('status') status?: DocumentStatus,
        @Query('category') category?: string,
        @Query('tags') tags?: string,
    ) {
        const filters = {
            status,
            category,
            tags: tags ? tags.split(',') : undefined,
        };

        return this.documentService.findAll(req.user.companyId, filters);
    }

    @Get('expiring')
    async findExpiring(
        @Req() req: AuthRequest,
        @Query('days') days: string = '30',
    ) {
        const daysThreshold = parseInt(days, 10) || 30;
        return this.documentService.findExpiring(req.user.companyId, daysThreshold);
    }

    @Get(':id')
    async findById(
        @Param('id') id: string,
        @Req() req: AuthRequest,
    ) {
        return this.documentService.findById(req.user.companyId, id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateDocumentDto,
        @Req() req: AuthRequest,
    ) {
        return this.documentService.update(
            req.user.companyId,
            id,
            dto,
            req.user.userId,
        );
    }

    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Req() req: AuthRequest,
    ) {
        return this.documentService.delete(
            req.user.companyId,
            id,
            req.user.userId,
        );
    }
}
