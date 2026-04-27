import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import {
  ManagedDocument,
  ManagedDocumentSchema,
} from './schemas/managed-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ManagedDocument.name, schema: ManagedDocumentSchema },
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
