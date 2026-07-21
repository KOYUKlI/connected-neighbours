import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Contract, ContractSchema } from '../contracts/schemas/contract.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { ContractDocumentsController } from './contract-documents.controller';
import { DocumentPdfService } from './document-pdf.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import {
  ManagedDocument,
  ManagedDocumentSchema,
} from './schemas/managed-document.schema';

@Module({
  imports: [
    StorageModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: ManagedDocument.name, schema: ManagedDocumentSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [DocumentsController, ContractDocumentsController],
  providers: [DocumentsService, DocumentPdfService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
