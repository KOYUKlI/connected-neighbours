import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';

import { AddSignatureFieldDto } from './dto/add-signature-field.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { SignFieldDto } from './dto/sign-field.dto';
import {
  ManagedDocument,
  ManagedDocumentDocument,
  ManagedDocumentStatus,
} from './schemas/managed-document.schema';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(ManagedDocument.name)
    private readonly documentModel: Model<ManagedDocumentDocument>,
  ) {}

  async create(dto: CreateDocumentDto, ownerId: string) {
    return this.documentModel.create({
      ...dto,
      ownerId,
      mimeType: 'application/pdf',
      contextType: dto.contextType ?? null,
      contextId: dto.contextId ?? null,
      status: ManagedDocumentStatus.DRAFT,
      fields: [],
      auditTrail: [
        {
          action: 'created',
          userId: ownerId,
          at: new Date(),
        },
      ],
    });
  }

  async findMine(userId: string) {
    return this.documentModel
      .find({
        $or: [
          { ownerId: userId },
          { 'fields.assignedToUserId': userId },
          { 'fields.signedByUserId': userId },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string) {
    const document = await this.documentModel.findById(id).exec();

    if (!document) {
      throw new NotFoundException(`Document ${id} introuvable`);
    }

    this.assertCanRead(document, userId);

    return document;
  }

  async addField(id: string, userId: string, dto: AddSignatureFieldDto) {
    const document = await this.documentModel.findById(id).exec();

    if (!document) {
      throw new NotFoundException(`Document ${id} introuvable`);
    }

    if (document.ownerId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut préparer le PDF');
    }

    if (document.status === ManagedDocumentStatus.SIGNED) {
      throw new BadRequestException(
        'Un document signé ne peut plus être modifié',
      );
    }

    const field = {
      id: randomUUID(),
      ...dto,
    };

    document.fields.push(field);
    document.status = ManagedDocumentStatus.PENDING_SIGNATURE;
    document.auditTrail.push({
      action: 'field_added',
      userId,
      at: new Date(),
      fieldId: field.id,
    });
    document.markModified('fields');
    document.markModified('auditTrail');

    return document.save();
  }

  async signField(
    id: string,
    fieldId: string,
    userId: string,
    dto: SignFieldDto,
  ) {
    const document = await this.documentModel.findById(id).exec();

    if (!document) {
      throw new NotFoundException(`Document ${id} introuvable`);
    }

    const field = document.fields.find((candidate) => candidate.id === fieldId);

    if (!field) {
      throw new NotFoundException(`Zone ${fieldId} introuvable`);
    }

    if (field.assignedToUserId !== userId) {
      throw new ForbiddenException(
        'Cette zone de signature ne vous est pas assignée',
      );
    }

    field.signedByUserId = userId;
    field.signedAt = new Date();
    document.auditTrail.push({
      action: dto.signatureProof ? 'field_signed_with_proof' : 'field_signed',
      userId,
      at: new Date(),
      fieldId,
    });

    const allFieldsSigned =
      document.fields.length > 0 &&
      document.fields.every((candidate) => !!candidate.signedAt);

    if (allFieldsSigned) {
      document.status = ManagedDocumentStatus.SIGNED;
      document.auditTrail.push({
        action: 'document_signed',
        userId,
        at: new Date(),
      });
    }

    document.markModified('fields');
    document.markModified('auditTrail');

    return document.save();
  }

  private assertCanRead(document: ManagedDocumentDocument, userId: string) {
    const isParticipant = document.fields.some(
      (field) =>
        field.assignedToUserId === userId || field.signedByUserId === userId,
    );

    if (document.ownerId !== userId && !isParticipant) {
      throw new ForbiddenException('Accès interdit à ce document');
    }
  }
}
