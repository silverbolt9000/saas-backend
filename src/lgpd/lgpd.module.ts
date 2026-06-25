import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LgpdService } from './lgpd.service';
import { LgpdController } from './lgpd.controller';
import { DocumentService } from './services/document.service';
import { AlertService } from './services/alert.service';
import { FileUploadService } from './services/file-upload.service';
import { DocumentController } from './controllers/document.controller';
import { AlertController } from './controllers/alert.controller';
import { UploadController } from './controllers/upload.controller';
import { LgpdDocument, LgpdDocumentSchema } from './schemas/document.schema';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { CompanyModule } from '../company/company.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: LgpdDocument.name, schema: LgpdDocumentSchema },
        ]),
        UsersModule,
        AuditModule,
        CompanyModule,
        NotificationsModule,
    ],
    providers: [LgpdService, DocumentService, AlertService, FileUploadService],
    controllers: [LgpdController, DocumentController, AlertController, UploadController],
    exports: [DocumentService],
})
export class LgpdModule { }
