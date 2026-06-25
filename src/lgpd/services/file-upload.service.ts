import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class FileUploadService {
    private readonly logger = new Logger(FileUploadService.name);

    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private readonly ALLOWED_MIME_TYPES = ['application/pdf'];
    private readonly ALLOWED_EXTENSIONS = ['.pdf'];

    /**
     * Validar arquivo de upload
     */
    validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado');
        }

        // Validar tamanho
        if (file.size > this.MAX_FILE_SIZE) {
            throw new BadRequestException(
                `Arquivo muito grande. Máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
            );
        }

        // Validar tipo MIME
        if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Tipo de arquivo não permitido. Permitidos: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
            );
        }

        // Validar extensão
        const fileExtension = this.getFileExtension(file.originalname);
        if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
            throw new BadRequestException(
                `Extensão não permitida. Permitidas: ${this.ALLOWED_EXTENSIONS.join(', ')}`,
            );
        }

        this.logger.log(`Arquivo validado: ${file.originalname} (${file.size} bytes)`);
    }

    /**
     * Gerar nome único para o arquivo
     */
    generateFileName(originalName: string, documentId: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const extension = this.getFileExtension(originalName);
        return `${documentId}-${timestamp}-${random}${extension}`;
    }

    /**
     * Extrair extensão do arquivo
     */
    private getFileExtension(fileName: string): string {
        const lastDot = fileName.lastIndexOf('.');
        if (lastDot === -1) {
            return '';
        }
        return fileName.substring(lastDot).toLowerCase();
    }

    /**
     * Gerar URL do arquivo (placeholder para S3)
     * TODO: Implementar upload real para S3
     */
    generateFileUrl(fileName: string, bucketName: string = 'lgpd-documents'): string {
        // Placeholder: retornar URL local para desenvolvimento
        // Em produção, isso seria uma URL S3
        return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    }

    /**
     * Validar URL do arquivo
     */
    isValidFileUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
