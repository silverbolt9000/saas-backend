import {
    Controller,
    Post,
    Param,
    UseInterceptors,
    UploadedFile,
    Req,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from '../services/document.service';
import { FileUploadService } from '../services/file-upload.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AuthRequest } from '../../auth/auth-request.interface';

@Controller('lgpd/documents')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(
        private readonly documentService: DocumentService,
        private readonly fileUploadService: FileUploadService,
    ) { }

    /**
     * Upload de arquivo PDF para um documento
     * POST /lgpd/documents/:id/upload
     */
    @Post(':id/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @Param('id') documentId: string,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: AuthRequest,
    ) {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado');
        }

        // Validar arquivo
        this.fileUploadService.validateFile(file);

        // Verificar se documento existe e pertence à empresa
        const document = await this.documentService.findById(
            req.user.companyId,
            documentId,
        );

        if (!document) {
            throw new BadRequestException('Documento não encontrado');
        }

        // Gerar nome único para o arquivo
        const fileName = this.fileUploadService.generateFileName(
            file.originalname,
            documentId,
        );

        // Gerar URL do arquivo
        const fileUrl = this.fileUploadService.generateFileUrl(fileName);

        // TODO: Fazer upload real para S3
        // const uploadedFileUrl = await this.s3Service.uploadFile(file, fileName);

        // Atualizar documento com informações do arquivo
        const updatedDocument = await this.documentService.updateFileInfo(
            documentId,
            fileUrl,
            file.originalname,
            file.size,
        );

        return {
            success: true,
            document: updatedDocument,
            file: {
                originalName: file.originalname,
                fileName,
                size: file.size,
                url: fileUrl,
            },
        };
    }
}
