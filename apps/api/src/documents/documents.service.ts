import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import { GraphSyncService } from '../graph/graph-sync.service';
import { GraphEntityType } from '../graph/graph.types';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { DownloadDisposition } from '../storage/dto/download-file-query.dto';
import { StorageContextType } from '../storage/schemas/storage-file.schema';
import { StorageService } from '../storage/storage.service';
import { PublicUsersService } from '../users/public-users.service';
import { DocumentPdfService } from './document-pdf.service';
import { ImportContractDocumentDto } from './dto/import-contract-document.dto';
import {
  DocumentListRole,
  ListDocumentsQueryDto,
} from './dto/list-documents-query.dto';
import { SignDocumentDto } from './dto/sign-document.dto';
import {
  DocumentFieldDto,
  UpdateDocumentFieldsDto,
} from './dto/update-document-fields.dto';
import {
  DocumentSignerStatus,
  ManagedDocument,
  ManagedDocumentDocument,
  ManagedDocumentStatus,
  ManagedDocumentType,
  SignatureFieldType,
  type DocumentAuditEntry,
  type DocumentSignatureEvent,
  type SignatureField,
} from './schemas/managed-document.schema';

const CONSENT_VERSION = 'signature-applicative-v1';
const SIGNATURE_CLAIM_TTL_MS = 5 * 60 * 1000;
const ACTIVE_DOCUMENT_STATUSES = [
  ManagedDocumentStatus.DRAFT,
  ManagedDocumentStatus.UPLOADED,
  ManagedDocumentStatus.PREPARED,
  ManagedDocumentStatus.SENT_FOR_SIGNATURE,
  ManagedDocumentStatus.PARTIALLY_SIGNED,
  ManagedDocumentStatus.SIGNED,
  ManagedDocumentStatus.FINALIZED,
  ManagedDocumentStatus.ARCHIVED,
];

type DocumentRow = ManagedDocument & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
type ContractRow = Contract & { _id: unknown };
type ServiceRow = Service & { _id: unknown };

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(ManagedDocument.name)
    private readonly documentModel: Model<ManagedDocumentDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly storageService: StorageService,
    private readonly pdfService: DocumentPdfService,
    private readonly publicUsersService: PublicUsersService,
    @Optional() private readonly graphSyncService?: GraphSyncService,
  ) {}

  async generateContractDocument(contractId: string, actor: AuthenticatedUser) {
    const contract = await this.findContract(contractId);
    this.assertCanPrepare(contract, actor);
    this.assertContractDocumentAllowed(contract);
    const existing = await this.findActiveForContract(contractId);
    if (existing) return this.presentOne(existing, actor);
    const service = await this.findService(contract.serviceId);
    const users = await this.publicUsersService.findByIds([
      contract.requesterId,
      contract.providerId,
    ]);
    const requester = users.get(contract.requesterId);
    const provider = users.get(contract.providerId);
    if (!requester || !provider)
      throw new ConflictException(
        'Les profils publics des parties sont indisponibles.',
      );
    const documentId = new Types.ObjectId().toString();
    const generated = await this.pdfService.generateContractPdf({
      documentId,
      contract,
      service,
      requester,
      provider,
    });
    const original = await this.storageService.putVerifiedBuffer({
      buffer: generated.bytes,
      filename: `contrat-${service.title}.pdf`,
      ownerId: contract.requesterId,
      contextType: StorageContextType.CONTRACT_DOCUMENT,
      contextId: contract.id,
    });
    try {
      if (!original.sha256)
        throw new ConflictException('Empreinte du PDF genere indisponible.');
      const document = await this.documentModel.create({
        _id: documentId,
        title: `Contrat - ${service.title}`,
        type: ManagedDocumentType.CONTRACT,
        contractId: contract.id,
        serviceId: contract.serviceId,
        ownerId: contract.requesterId,
        status: ManagedDocumentStatus.PREPARED,
        originalFileId: original.id,
        currentFileId: original.id,
        finalFileId: null,
        originalSha256: original.sha256,
        currentSha256: original.sha256,
        finalSha256: null,
        pageCount: generated.pageCount,
        fields: this.defaultSignatureFields(contract),
        signers: this.defaultSigners(contract),
        signatures: [],
        auditTrail: [this.audit('document_generated', actor.sub)],
        version: 1,
        signatureClaim: null,
        sentForSignatureAt: null,
        finalizedAt: null,
        archivedAt: null,
        cancelledAt: null,
      });
      await this.contractModel.updateOne(
        { _id: contract.id },
        { $set: { documentId: document.id } },
      );
      return this.presentOne(document, actor);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        await this.storageService.removeOrphan(original.id);
        const concurrent = await this.findActiveForContract(contract.id);
        if (concurrent) return this.presentOne(concurrent, actor);
      }
      throw error;
    }
  }

  async importContractDocument(
    contractId: string,
    dto: ImportContractDocumentDto,
    actor: AuthenticatedUser,
  ) {
    const contract = await this.findContract(contractId);
    this.assertCanPrepare(contract, actor);
    this.assertContractDocumentAllowed(contract);
    if (await this.findActiveForContract(contractId))
      throw new ConflictException('Un document contractuel actif existe déjà.');
    const file = await this.storageService.getVerifiedFile(dto.fileId);
    if (
      file.contextId !== contract.id ||
      file.contextType !== StorageContextType.CONTRACT_DOCUMENT
    )
      throw new ForbiddenException('Ce fichier ne correspond pas au contrat.');
    if (file.ownerId !== actor.sub && actor.role !== Role.ADMIN)
      throw new ForbiddenException('Ce fichier ne vous appartient pas.');
    if (!file.sha256)
      throw new ConflictException('Empreinte du PDF importe indisponible.');
    const { buffer } = await this.storageService.getVerifiedBuffer(file.id);
    const inspected = await this.pdfService.inspect(buffer);
    const document = await this.documentModel.create({
      title: dto.title,
      type: ManagedDocumentType.IMPORTED_DOCUMENT,
      contractId: contract.id,
      serviceId: contract.serviceId,
      ownerId: contract.requesterId,
      status: ManagedDocumentStatus.UPLOADED,
      originalFileId: file.id,
      currentFileId: file.id,
      finalFileId: null,
      originalSha256: file.sha256,
      currentSha256: file.sha256,
      finalSha256: null,
      pageCount: inspected.pageCount,
      fields: [],
      signers: this.defaultSigners(contract),
      signatures: [],
      auditTrail: [this.audit('document_imported', actor.sub)],
      version: 1,
      signatureClaim: null,
      sentForSignatureAt: null,
      finalizedAt: null,
      archivedAt: null,
      cancelledAt: null,
    });
    await this.contractModel.updateOne(
      { _id: contract.id },
      { $set: { documentId: document.id } },
    );
    return this.presentOne(document, actor);
  }

  async list(actor: AuthenticatedUser, query: ListDocumentsQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.contractId) filter.contractId = query.contractId;
    if (actor.role !== Role.ADMIN) {
      if (query.role === DocumentListRole.OWNED) filter.ownerId = actor.sub;
      else if (query.role === DocumentListRole.TO_SIGN)
        filter.signers = {
          $elemMatch: {
            userId: actor.sub,
            status: DocumentSignerStatus.PENDING,
          },
        };
      else if (query.role === DocumentListRole.COMPLETED) {
        filter['signers.userId'] = actor.sub;
        filter.status = {
          $in: [
            ManagedDocumentStatus.FINALIZED,
            ManagedDocumentStatus.ARCHIVED,
          ],
        };
      } else filter['signers.userId'] = actor.sub;
    }
    const [items, total] = await Promise.all([
      this.documentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<DocumentRow[]>()
        .exec(),
      this.documentModel.countDocuments(filter).exec(),
    ]);
    return {
      items: await this.presentMany(items, actor),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const document = await this.findDocument(id);
    await this.assertCanRead(document, actor);
    if (
      [
        ManagedDocumentStatus.FINALIZED,
        ManagedDocumentStatus.ARCHIVED,
      ].includes(document.status)
    )
      await this.ensureContractActivated(document);
    return this.presentOne(document, actor);
  }

  async findForContract(contractId: string, actor: AuthenticatedUser) {
    const contract = await this.findContract(contractId);
    this.assertCanReadContract(contract, actor);
    const document = await this.findActiveForContract(contractId);
    return document ? this.presentOne(document, actor) : null;
  }

  async updateFields(
    id: string,
    dto: UpdateDocumentFieldsDto,
    actor: AuthenticatedUser,
  ) {
    const document = await this.findDocument(id);
    const contract = await this.findContract(document.contractId);
    this.assertCanPrepare(contract, actor);
    if (
      ![
        ManagedDocumentStatus.DRAFT,
        ManagedDocumentStatus.UPLOADED,
        ManagedDocumentStatus.PREPARED,
      ].includes(document.status)
    )
      throw new ConflictException(
        'La préparation est verrouillée après l’envoi en signature.',
      );
    const fields = this.normalizeAndValidateFields(
      dto.fields,
      document,
      contract,
    );
    document.fields = fields;
    document.status =
      fields.length > 0
        ? ManagedDocumentStatus.PREPARED
        : ManagedDocumentStatus.UPLOADED;
    document.version += 1;
    document.auditTrail.push(
      this.audit('fields_prepared', actor.sub, { count: fields.length }),
    );
    document.markModified('fields');
    document.markModified('auditTrail');
    return this.presentOne(await document.save(), actor);
  }

  async sendForSignature(id: string, actor: AuthenticatedUser) {
    const document = await this.findDocument(id);
    const contract = await this.findContract(document.contractId);
    this.assertCanPrepare(contract, actor);
    this.assertContractDocumentAllowed(contract);
    if (document.status !== ManagedDocumentStatus.PREPARED)
      throw new ConflictException(
        'Le document doit être préparé avant l’envoi.',
      );
    this.assertRequiredSignatureFields(document.fields, contract);
    await this.storageService.getVerifiedFile(document.originalFileId);
    const updated = await this.documentModel
      .findOneAndUpdate(
        {
          _id: document.id,
          status: ManagedDocumentStatus.PREPARED,
          version: document.version,
        },
        {
          $set: {
            status: ManagedDocumentStatus.SENT_FOR_SIGNATURE,
            sentForSignatureAt: new Date(),
          },
          $inc: { version: 1 },
          $push: { auditTrail: this.audit('sent_for_signature', actor.sub) },
        },
        { returnDocument: 'after' },
      )
      .exec();
    if (!updated)
      throw new ConflictException(
        'Le document a été modifié par une autre session.',
      );
    return this.presentOne(updated, actor);
  }
  async sign(id: string, dto: SignDocumentDto, actor: AuthenticatedUser) {
    let document = await this.findDocument(id);
    const contract = await this.findContract(document.contractId);
    this.assertContractDocumentAllowed(contract);
    this.assertParty(contract, actor.sub);
    if (
      [
        ManagedDocumentStatus.FINALIZED,
        ManagedDocumentStatus.ARCHIVED,
      ].includes(document.status)
    ) {
      await this.ensureContractActivated(document);
      throw new ConflictException('Vous avez déjà signé ce document.');
    }
    if (
      ![
        ManagedDocumentStatus.SENT_FOR_SIGNATURE,
        ManagedDocumentStatus.PARTIALLY_SIGNED,
      ].includes(document.status)
    )
      throw new ConflictException(
        'Ce document n’est pas en attente de votre signature.',
      );
    const signer = document.signers.find((item) => item.userId === actor.sub);
    if (!signer || signer.status === DocumentSignerStatus.SIGNED)
      throw new ConflictException('Vous avez déjà signé ce document.');
    const assignedFields = document.fields.filter(
      (field) => field.assignedToUserId === actor.sub,
    );
    if (assignedFields.length === 0)
      throw new ConflictException('Aucun champ ne vous est assigné.');
    const assignedFieldIds = new Set(assignedFields.map((field) => field.id));
    if (dto.values.some((value) => !assignedFieldIds.has(value.fieldId))) {
      throw new ForbiddenException(
        'Vous ne pouvez renseigner que vos propres champs.',
      );
    }
    if (
      new Set(dto.values.map((value) => value.fieldId)).size !==
      dto.values.length
    ) {
      throw new BadRequestException(
        'Un champ ne peut être renseigné qu’une fois.',
      );
    }
    const signedFields = this.resolveSignedFields(assignedFields, dto);
    const claim = await this.documentModel
      .findOneAndUpdate(
        {
          _id: document.id,
          version: document.version,
          status: {
            $in: [
              ManagedDocumentStatus.SENT_FOR_SIGNATURE,
              ManagedDocumentStatus.PARTIALLY_SIGNED,
            ],
          },
          $or: [
            { signatureClaim: null },
            {
              'signatureClaim.claimedAt': {
                $lt: new Date(Date.now() - SIGNATURE_CLAIM_TTL_MS),
              },
            },
          ],
        },
        {
          $set: {
            signatureClaim: {
              userId: actor.sub,
              claimedAt: new Date(),
              sourceVersion: document.version,
            },
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
    if (!claim)
      throw new ConflictException(
        'Une autre signature est en cours. Réessayez dans un instant.',
      );
    document = claim;
    let revisionFileId: string | null = null;
    let finalFileId: string | null = null;
    let documentCommitted = false;
    try {
      const source = await this.storageService.getVerifiedBuffer(
        document.currentFileId,
      );
      if (source.file.sha256 !== document.currentSha256)
        throw new ConflictException(
          'La révision courante ne correspond pas à son empreinte.',
        );
      const profiles = await this.publicUsersService.findByIds([
        contract.requesterId,
        contract.providerId,
      ]);
      const signerName =
        profiles.get(actor.sub)?.displayName ?? actor.displayName;
      const now = new Date();
      const reference = `SIG-${randomUUID().slice(0, 8).toUpperCase()}`;
      const revisionBytes = await this.pdfService.applySignature({
        source: source.buffer,
        fields: signedFields,
        signerName,
        signatureText: dto.signatureText.trim(),
        signedAt: now,
        reference,
      });
      const revision = await this.storageService.putVerifiedBuffer({
        buffer: revisionBytes,
        filename: `${document.title}-revision-${document.version + 1}.pdf`,
        ownerId: document.ownerId,
        contextType: StorageContextType.DOCUMENT_REVISION,
        contextId: contract.id,
      });
      revisionFileId = revision.id;
      const event: DocumentSignatureEvent = {
        id: randomUUID(),
        signerId: actor.sub,
        fieldIds: signedFields.map((field) => field.id),
        signedAt: now,
        sourceSha256: document.currentSha256,
        resultSha256: revision.sha256!,
        documentVersion: document.version + 1,
        consentVersion: CONSENT_VERSION,
        auditReference: reference,
      };
      const nextFields = document.fields.map(
        (field) =>
          signedFields.find((candidate) => candidate.id === field.id) ?? field,
      );
      const nextSigners = document.signers.map((item) =>
        item.userId === actor.sub
          ? { ...item, status: DocumentSignerStatus.SIGNED, signedAt: now }
          : item,
      );
      const nextSignatures = [...document.signatures, event];
      const allRequiredSigned = nextFields.every(
        (field) => !field.required || !!field.signedAt,
      );
      let finalFile: Awaited<
        ReturnType<StorageService['putVerifiedBuffer']>
      > | null = null;
      if (allRequiredSigned) {
        const finalBytes = await this.pdfService.finalize({
          source: revisionBytes,
          documentId: document.id,
          signatures: nextSignatures,
          signedRevisionSha256: revision.sha256!,
          finalizedAt: now,
          signerNames: new Map(
            [...profiles].map(([key, value]) => [key, value.displayName]),
          ),
        });
        finalFile = await this.storageService.putVerifiedBuffer({
          buffer: finalBytes,
          filename: `${document.title}-final.pdf`,
          ownerId: document.ownerId,
          contextType: StorageContextType.DOCUMENT_FINAL,
          contextId: contract.id,
        });
        finalFileId = finalFile.id;
      }
      const updated = await this.documentModel
        .findOneAndUpdate(
          {
            _id: document.id,
            version: document.version,
            'signatureClaim.userId': actor.sub,
          },
          {
            $set: {
              fields: nextFields,
              signers: nextSigners,
              signatures: nextSignatures,
              currentFileId: revision.id,
              currentSha256: revision.sha256,
              finalFileId: finalFile?.id ?? null,
              finalSha256: finalFile?.sha256 ?? null,
              finalizedAt: allRequiredSigned ? now : null,
              status: allRequiredSigned
                ? ManagedDocumentStatus.FINALIZED
                : ManagedDocumentStatus.PARTIALLY_SIGNED,
              signatureClaim: null,
            },
            $inc: { version: 1 },
            $push: {
              auditTrail: {
                $each: [
                  this.audit('document_signed', actor.sub, {
                    reference,
                    fieldCount: signedFields.length,
                  }),
                  ...(allRequiredSigned
                    ? [this.audit('document_finalized', actor.sub)]
                    : []),
                ],
              },
            },
          },
          { returnDocument: 'after' },
        )
        .exec();
      if (!updated)
        throw new ConflictException(
          'La signature n’a pas pu être enregistrée.',
        );
      documentCommitted = true;
      if (allRequiredSigned) await this.ensureContractActivated(updated);
      return this.presentOne(updated, actor);
    } catch (error) {
      await this.documentModel.updateOne(
        { _id: document.id, 'signatureClaim.userId': actor.sub },
        { $set: { signatureClaim: null } },
      );
      if (!documentCommitted && revisionFileId)
        await this.storageService.removeOrphan(revisionFileId);
      if (!documentCommitted && finalFileId)
        await this.storageService.removeOrphan(finalFileId);
      throw error;
    }
  }

  async legacySignContract(
    contractId: string,
    actor: AuthenticatedUser,
    input: { consent: true; signatureText: string },
  ) {
    let document = await this.findActiveForContract(contractId);
    if (!document) {
      await this.generateContractDocument(contractId, actor);
      document = await this.findActiveForContract(contractId);
    }
    if (!document)
      throw new ConflictException(
        'Le document contractuel n’a pas pu être généré.',
      );
    if (document.status === ManagedDocumentStatus.PREPARED) {
      await this.sendForSignature(document.id, actor);
      document = await this.findDocument(document.id);
    }
    const values = document.fields
      .filter((field) => field.assignedToUserId === actor.sub)
      .map((field) => ({
        fieldId: field.id,
        value:
          field.type === SignatureFieldType.CHECKBOX
            ? true
            : field.type === SignatureFieldType.INITIALS
              ? this.initials(input.signatureText)
              : input.signatureText,
      }));
    await this.sign(document.id, { ...input, values }, actor);
    return this.findContract(contractId);
  }

  async archive(id: string, actor: AuthenticatedUser) {
    const document = await this.findDocument(id);
    if (actor.role !== Role.ADMIN)
      throw new ForbiddenException(
        'Seul un administrateur peut archiver ce document.',
      );
    if (document.status !== ManagedDocumentStatus.FINALIZED)
      throw new ConflictException(
        'Seul un document finalisé peut être archivé.',
      );
    document.status = ManagedDocumentStatus.ARCHIVED;
    document.archivedAt = new Date();
    document.version += 1;
    document.auditTrail.push(this.audit('document_archived', actor.sub));
    document.markModified('auditTrail');
    return this.presentOne(await document.save(), actor);
  }

  async cancel(id: string, actor: AuthenticatedUser) {
    const document = await this.findDocument(id);
    const contract = await this.findContract(document.contractId);
    this.assertCanPrepare(contract, actor);
    if (
      [
        ManagedDocumentStatus.PARTIALLY_SIGNED,
        ManagedDocumentStatus.SIGNED,
        ManagedDocumentStatus.FINALIZED,
        ManagedDocumentStatus.ARCHIVED,
      ].includes(document.status)
    )
      throw new ConflictException(
        'Un document déjà signé ne peut pas être annulé.',
      );
    document.status = ManagedDocumentStatus.CANCELLED;
    document.cancelledAt = new Date();
    document.version += 1;
    document.auditTrail.push(this.audit('document_cancelled', actor.sub));
    document.markModified('auditTrail');
    await document.save();
    return this.presentOne(document, actor);
  }

  async createDownloadUrl(
    id: string,
    variant: 'original' | 'current' | 'final',
    disposition: DownloadDisposition,
    actor: AuthenticatedUser,
  ) {
    const document = await this.findDocument(id);
    await this.assertCanRead(document, actor);
    const fileId =
      variant === 'original'
        ? document.originalFileId
        : variant === 'final'
          ? document.finalFileId
          : document.currentFileId;
    if (!fileId)
      throw new NotFoundException(
        'Cette version du document n’est pas disponible.',
      );
    return this.storageService.createAuthorizedDownloadUrl(
      fileId,
      actor,
      disposition,
    );
  }
  private async presentOne(
    document: ManagedDocumentDocument | DocumentRow,
    actor: AuthenticatedUser,
  ) {
    const [item] = await this.presentMany([document as DocumentRow], actor);
    return item;
  }

  private async presentMany(
    documents: DocumentRow[],
    actor: AuthenticatedUser,
  ) {
    if (documents.length === 0) return [];
    const contracts = await this.contractModel
      .find({
        _id: { $in: [...new Set(documents.map((item) => item.contractId))] },
      })
      .lean<ContractRow[]>()
      .exec();
    const services = await this.serviceModel
      .find({
        _id: { $in: [...new Set(contracts.map((item) => item.serviceId))] },
      })
      .select('_id title status category')
      .lean<ServiceRow[]>()
      .exec();
    const profiles = await this.publicUsersService.findByIds([
      ...new Set(
        contracts.flatMap((item) => [item.requesterId, item.providerId]),
      ),
    ]);
    const contractById = new Map(
      contracts.map((item) => [String(item._id), item]),
    );
    const serviceById = new Map(
      services.map((item) => [String(item._id), item]),
    );
    return documents.map((document) => {
      const contract = contractById.get(document.contractId);
      const service = contract
        ? serviceById.get(contract.serviceId)
        : undefined;
      const isParty =
        !!contract &&
        [contract.requesterId, contract.providerId].includes(actor.sub);
      const isOwner = document.ownerId === actor.sub;
      const canPrepare =
        !!contract &&
        (actor.role === Role.ADMIN || contract.requesterId === actor.sub) &&
        this.canPrepareStatus(document.status);
      const signer = document.signers.find((item) => item.userId === actor.sub);
      const canSign =
        isParty &&
        signer?.status === DocumentSignerStatus.PENDING &&
        [
          ManagedDocumentStatus.SENT_FOR_SIGNATURE,
          ManagedDocumentStatus.PARTIALLY_SIGNED,
        ].includes(document.status) &&
        contract?.status !== ContractStatus.DISPUTED &&
        !contract?.activeDisputeId;
      return {
        id: String(document._id),
        title: document.title,
        type: document.type,
        contractId: document.contractId,
        serviceId: document.serviceId,
        ownerId: document.ownerId,
        status: document.status,
        pageCount: document.pageCount,
        fields: document.fields,
        signers: document.signers.map((item) => ({
          ...item,
          profile: profiles.get(item.userId) ?? null,
        })),
        signatures: document.signatures,
        auditTrail: document.auditTrail.filter(
          (entry) => actor.role === Role.ADMIN || !entry.internal,
        ),
        version: document.version,
        sentForSignatureAt: document.sentForSignatureAt,
        finalizedAt: document.finalizedAt,
        archivedAt: document.archivedAt,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        hashes: {
          original: document.originalSha256,
          current: document.currentSha256,
          final: document.finalSha256,
        },
        files: {
          original: { id: document.originalFileId, available: true },
          current: { id: document.currentFileId, available: true },
          final: document.finalFileId
            ? { id: document.finalFileId, available: true }
            : null,
        },
        contract: contract
          ? {
              id: String(contract._id),
              status: contract.status,
              pricePoints: contract.pricePoints,
              requester: profiles.get(contract.requesterId) ?? null,
              provider: profiles.get(contract.providerId) ?? null,
            }
          : null,
        service: service
          ? {
              id: String(service._id),
              title: service.title,
              status: service.status,
              category: service.category,
            }
          : null,
        progress: {
          signed: document.signers.filter(
            (item) => item.status === DocumentSignerStatus.SIGNED,
          ).length,
          total: document.signers.length,
        },
        permissions: {
          canUploadDocument:
            !!contract &&
            (actor.role === Role.ADMIN || contract.requesterId === actor.sub) &&
            !document.sentForSignatureAt,
          canGenerateContractDocument:
            !!contract &&
            (actor.role === Role.ADMIN || contract.requesterId === actor.sub),
          canPrepareDocument: canPrepare,
          canSendForSignature:
            canPrepare && document.status === ManagedDocumentStatus.PREPARED,
          canSign,
          canDownloadOriginal: isParty || actor.role === Role.ADMIN,
          canDownloadCurrent: isParty || actor.role === Role.ADMIN,
          canDownloadFinal:
            (isParty || actor.role === Role.ADMIN) && !!document.finalFileId,
          canArchive:
            actor.role === Role.ADMIN &&
            document.status === ManagedDocumentStatus.FINALIZED,
          canCancel:
            (isOwner || actor.role === Role.ADMIN) &&
            this.canPrepareStatus(document.status),
          canViewAudit: isParty || actor.role === Role.ADMIN,
        },
      };
    });
  }

  private normalizeAndValidateFields(
    input: DocumentFieldDto[],
    document: ManagedDocumentDocument,
    contract: ContractDocument,
  ) {
    const parties = new Set([contract.requesterId, contract.providerId]);
    const ids = new Set<string>();
    const fields: SignatureField[] = input.map((item) => {
      if (item.pageNumber > document.pageCount)
        throw new BadRequestException('Le numéro de page dépasse le PDF.');
      if (item.x + item.width > 1 || item.y + item.height > 1)
        throw new BadRequestException(
          'Une zone dépasse les limites de la page.',
        );
      if (!parties.has(item.assignedToUserId))
        throw new BadRequestException(
          'Le signataire assigné ne fait pas partie du contrat.',
        );
      const id = item.id ?? randomUUID();
      if (ids.has(id))
        throw new BadRequestException(
          'Deux zones utilisent le même identifiant.',
        );
      ids.add(id);
      return {
        id,
        type: item.type,
        pageNumber: item.pageNumber,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        assignedToUserId: item.assignedToUserId,
        required: item.required,
        label: item.label ?? null,
        signedAt: null,
        value: null,
        signatureId: null,
      };
    });
    for (let index = 0; index < fields.length; index += 1) {
      for (let other = index + 1; other < fields.length; other += 1) {
        if (this.overlapRatio(fields[index], fields[other]) > 0.8)
          throw new BadRequestException(
            'Deux zones se chevauchent presque entièrement.',
          );
      }
    }
    return fields;
  }

  private resolveSignedFields(fields: SignatureField[], dto: SignDocumentDto) {
    const values = new Map(
      dto.values.map((item) => [item.fieldId, item.value]),
    );
    const now = new Date();
    const signatureId = randomUUID();
    return fields.map((field) => {
      if (field.signedAt)
        throw new ConflictException('Un champ signé est immuable.');
      let value: string | boolean;
      if (field.type === SignatureFieldType.SIGNATURE)
        value = dto.signatureText.trim();
      else if (field.type === SignatureFieldType.DATE)
        value = now.toISOString();
      else if (field.type === SignatureFieldType.INITIALS) {
        const supplied = values.get(field.id);
        value =
          typeof supplied === 'string' && supplied.trim()
            ? supplied.trim().slice(0, 12)
            : this.initials(dto.signatureText);
      } else if (field.type === SignatureFieldType.CHECKBOX) {
        value = values.get(field.id) === true;
        if (field.required && value !== true)
          throw new BadRequestException(
            `Le champ « ${field.label ?? 'confirmation'} » est obligatoire.`,
          );
      } else {
        const supplied = values.get(field.id);
        if (
          field.required &&
          (typeof supplied !== 'string' || !supplied.trim())
        )
          throw new BadRequestException(
            `Le champ « ${field.label ?? 'texte'} » est obligatoire.`,
          );
        value =
          typeof supplied === 'string' ? supplied.trim().slice(0, 500) : '';
      }
      return { ...field, value, signedAt: now, signatureId };
    });
  }

  private defaultSignatureFields(contract: ContractDocument): SignatureField[] {
    return [
      {
        id: randomUUID(),
        type: SignatureFieldType.SIGNATURE,
        pageNumber: 1,
        x: 0.091,
        y: 0.808,
        width: 0.37,
        height: 0.09,
        assignedToUserId: contract.requesterId,
        required: true,
        label: 'Signature du demandeur',
        signedAt: null,
        value: null,
        signatureId: null,
      },
      {
        id: randomUUID(),
        type: SignatureFieldType.SIGNATURE,
        pageNumber: 1,
        x: 0.539,
        y: 0.808,
        width: 0.37,
        height: 0.09,
        assignedToUserId: contract.providerId,
        required: true,
        label: 'Signature du prestataire',
        signedAt: null,
        value: null,
        signatureId: null,
      },
    ];
  }

  private defaultSigners(contract: ContractDocument) {
    return [
      {
        userId: contract.requesterId,
        status: DocumentSignerStatus.PENDING,
        signedAt: null,
      },
      {
        userId: contract.providerId,
        status: DocumentSignerStatus.PENDING,
        signedAt: null,
      },
    ];
  }

  private assertRequiredSignatureFields(
    fields: SignatureField[],
    contract: ContractDocument,
  ) {
    for (const userId of [contract.requesterId, contract.providerId]) {
      const valid = fields.some(
        (field) =>
          field.assignedToUserId === userId &&
          field.required &&
          field.type === SignatureFieldType.SIGNATURE,
      );
      if (!valid)
        throw new BadRequestException(
          'Chaque partie doit disposer d’une zone de signature obligatoire.',
        );
    }
  }

  private async ensureContractActivated(
    document: Pick<
      ManagedDocument,
      | 'contractId'
      | 'serviceId'
      | 'finalFileId'
      | 'finalSha256'
      | 'signers'
      | 'finalizedAt'
    >,
  ) {
    if (!document.finalFileId || !document.finalSha256)
      throw new ConflictException('Le PDF final n’est pas disponible.');
    await this.storageService.getVerifiedFile(document.finalFileId);
    const signedByIds = document.signers
      .filter((item) => item.status === DocumentSignerStatus.SIGNED)
      .map((item) => item.userId);
    const updated = await this.contractModel
      .findOneAndUpdate(
        {
          _id: document.contractId,
          status: { $in: [ContractStatus.SENT, ContractStatus.ACTIVE] },
          activeDisputeId: null,
        },
        {
          $set: {
            status: ContractStatus.ACTIVE,
            signedByIds,
            signedAt: document.finalizedAt ?? new Date(),
            finalizedDocumentFileId: document.finalFileId,
            documentFinalSha256: document.finalSha256,
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
    if (!updated)
      throw new ConflictException(
        'Le contrat ne peut pas être activé dans son état actuel.',
      );
    await this.serviceModel.updateOne(
      { _id: document.serviceId, status: ServiceStatus.AWAITING_SIGNATURES },
      {
        $set: {
          status: ServiceStatus.SCHEDULED,
          scheduledAt: updated.signedAt,
        },
      },
    );
    void this.graphSyncService?.enqueue(
      GraphEntityType.SERVICE,
      document.serviceId,
    );
  }

  private assertCanPrepare(
    contract: ContractDocument,
    actor: AuthenticatedUser,
  ) {
    if (actor.role !== Role.ADMIN && contract.requesterId !== actor.sub)
      throw new ForbiddenException(
        'Seul le demandeur peut préparer le document contractuel.',
      );
  }

  private async assertCanRead(
    document: ManagedDocumentDocument,
    actor: AuthenticatedUser,
  ) {
    const contract = await this.findContract(document.contractId);
    this.assertCanReadContract(contract, actor);
  }

  private assertCanReadContract(
    contract: ContractDocument,
    actor: AuthenticatedUser,
  ) {
    if (actor.role !== Role.ADMIN) this.assertParty(contract, actor.sub);
  }

  private assertParty(contract: ContractDocument, userId: string) {
    if (contract.requesterId !== userId && contract.providerId !== userId)
      throw new ForbiddenException(
        'Ce document n’est pas accessible avec votre compte.',
      );
  }

  private assertContractDocumentAllowed(contract: ContractDocument) {
    if (contract.status === ContractStatus.DISPUTED || contract.activeDisputeId)
      throw new ConflictException(
        'Ce contrat fait actuellement l’objet d’un litige.',
      );
    if (![ContractStatus.SENT, ContractStatus.ACTIVE].includes(contract.status))
      throw new ConflictException(
        'Le contrat n’est pas dans un état compatible avec la signature.',
      );
  }

  private canPrepareStatus(status: ManagedDocumentStatus) {
    return [
      ManagedDocumentStatus.DRAFT,
      ManagedDocumentStatus.UPLOADED,
      ManagedDocumentStatus.PREPARED,
    ].includes(status);
  }

  private async findActiveForContract(contractId: string) {
    return this.documentModel
      .findOne({ contractId, status: { $in: ACTIVE_DOCUMENT_STATUSES } })
      .exec();
  }

  private async findDocument(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Document introuvable.');
    const document = await this.documentModel.findById(id).exec();
    if (!document) throw new NotFoundException('Document introuvable.');
    return document;
  }

  private async findContract(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Contrat introuvable.');
    const contract = await this.contractModel.findById(id).exec();
    if (!contract) throw new NotFoundException('Contrat introuvable.');
    return contract;
  }

  private async findService(id: string) {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service introuvable.');
    return service;
  }

  private audit(
    action: string,
    actorId: string,
    metadata?: Record<string, string | number | boolean | null>,
  ): DocumentAuditEntry {
    return { action, actorId, at: new Date(), metadata };
  }

  private overlapRatio(first: SignatureField, second: SignatureField) {
    if (first.pageNumber !== second.pageNumber) return 0;
    const width = Math.max(
      0,
      Math.min(first.x + first.width, second.x + second.width) -
        Math.max(first.x, second.x),
    );
    const height = Math.max(
      0,
      Math.min(first.y + first.height, second.y + second.height) -
        Math.max(first.y, second.y),
    );
    return (
      (width * height) /
      Math.min(first.width * first.height, second.width * second.height)
    );
  }

  private initials(value: string) {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join('')
      .slice(0, 6);
  }
}
