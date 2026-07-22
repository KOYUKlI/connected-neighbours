import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import { PointsService } from '../points/points.service';
import { PublicUsersService } from '../users/public-users.service';
import { DownloadDisposition } from '../storage/dto/download-file-query.dto';
import { PresignProofUploadDto } from '../storage/dto/presign-proof-upload.dto';
import {
  StorageContextType,
  StorageLinkedEntityType,
} from '../storage/schemas/storage-file.schema';
import { StorageService } from '../storage/storage.service';
import { CreateServiceProofDto } from './dto/create-service-proof.dto';
import { RequestServiceCorrectionDto } from './dto/request-service-correction.dto';
import {
  ServiceProof,
  ServiceProofDocument,
  ServiceProofType,
} from './schemas/service-proof.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from './schemas/service.schema';

const STARTABLE_STATUSES = [
  ServiceStatus.CONTRACT_ACTIVE,
  ServiceStatus.SCHEDULED,
];
const PROOFABLE_STATUSES = [
  ServiceStatus.IN_PROGRESS,
  ServiceStatus.CORRECTION_REQUESTED,
];
const MODERATION_ROLES = new Set<Role>([Role.MODERATOR, Role.ADMIN]);

type ProofRow = ServiceProof & {
  _id: unknown;
  createdAt?: Date;
};

@Injectable()
export class ServiceExecutionService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(ServiceProof.name)
    private readonly proofModel: Model<ServiceProofDocument>,
    private readonly pointsService: PointsService,
    private readonly publicUsersService: PublicUsersService,
    private readonly storageService: StorageService,
  ) {}

  async presignProofUpload(
    serviceId: string,
    input: PresignProofUploadDto,
    actor: AuthenticatedUser,
  ) {
    const { service, contract } = await this.loadContext(serviceId);
    this.assertNotDisputed(service, contract);
    this.assertProvider(contract, actor.sub);
    this.assertActiveContract(contract);
    if (!PROOFABLE_STATUSES.includes(service.status)) {
      throw new ConflictException(
        'Un fichier peut être ajouté uniquement pendant l’exécution ou une correction.',
      );
    }
    return this.storageService.presignProofUpload(
      input,
      actor,
      StorageContextType.SERVICE_PROOF,
      service.id,
    );
  }

  async start(serviceId: string, actor: AuthenticatedUser) {
    const { service, contract } = await this.loadContext(serviceId);
    this.assertNotDisputed(service, contract);
    this.assertProvider(contract, actor.sub);
    this.assertActiveContract(contract);

    if (service.status === ServiceStatus.IN_PROGRESS) {
      throw new ConflictException('Ce service a déjà été démarré.');
    }
    if (!STARTABLE_STATUSES.includes(service.status)) {
      throw new ConflictException(
        'Ce service ne peut pas être démarré dans son statut actuel.',
      );
    }

    const startedAt = new Date();
    const updated = await this.serviceModel
      .findOneAndUpdate(
        {
          _id: service.id,
          contractId: contract.id,
          status: { $in: STARTABLE_STATUSES },
        },
        {
          $set: {
            status: ServiceStatus.IN_PROGRESS,
            startedAt,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException('Ce service a déjà été démarré.');
    }
    return this.presentExecution(updated, contract, false);
  }

  async addProof(
    serviceId: string,
    input: CreateServiceProofDto,
    actor: AuthenticatedUser,
  ) {
    const { service, contract } = await this.loadContext(serviceId);
    this.assertNotDisputed(service, contract);
    this.assertProvider(contract, actor.sub);
    this.assertActiveContract(contract);

    if (!PROOFABLE_STATUSES.includes(service.status)) {
      throw new ConflictException(
        'Une preuve ne peut être ajoutée que pendant l’exécution du service.',
      );
    }

    const message = input.message?.trim() || null;
    if (!message && !input.fileId) {
      throw new BadRequestException(
        'Ajoutez une description ou un fichier à la preuve.',
      );
    }

    const proofId = new Types.ObjectId().toHexString();
    let attachment: Awaited<
      ReturnType<StorageService['linkVerifiedFile']>
    > | null = null;
    if (input.fileId) {
      attachment = await this.storageService.linkVerifiedFile({
        fileId: input.fileId,
        ownerId: actor.sub,
        contextType: StorageContextType.SERVICE_PROOF,
        contextId: service.id,
        linkedEntityType: StorageLinkedEntityType.SERVICE_PROOF,
        linkedEntityId: proofId,
      });
    }

    try {
      const proof = await this.proofModel.create({
        _id: proofId,
        serviceId: service.id,
        authorId: actor.sub,
        type: attachment
          ? this.toServiceProofType(attachment.fileKind)
          : ServiceProofType.NOTE,
        message,
        fileReference: null,
        fileId: attachment?.fileId ?? null,
        fileKind: attachment?.fileKind ?? null,
        originalFilename: attachment?.originalFilename ?? null,
        mimeType: attachment?.mimeType ?? null,
        sizeBytes: attachment?.sizeBytes ?? null,
        sha256: attachment?.sha256 ?? null,
        attachmentDeletedAt: null,
      });
      const [presented] = await this.presentProofs(
        [proof.toObject() as ProofRow],
        actor,
        service,
      );
      return presented;
    } catch (error) {
      if (attachment) {
        await this.storageService.releaseFileLink(
          attachment.fileId,
          StorageLinkedEntityType.SERVICE_PROOF,
          proofId,
        );
      }
      throw error;
    }
  }

  async findProofs(serviceId: string, actor: AuthenticatedUser) {
    const { service, contract } = await this.loadContext(serviceId);
    const canModerate = MODERATION_ROLES.has(actor.role);
    if (!canModerate) this.assertParticipant(contract, actor.sub);

    const proofs = await this.proofModel
      .find({ serviceId: service.id })
      .sort({ createdAt: 1, _id: 1 })
      .lean<ProofRow[]>()
      .exec();
    return this.presentProofs(proofs, actor, service);
  }

  async createProofDownloadUrl(
    serviceId: string,
    proofId: string,
    actor: AuthenticatedUser,
    disposition: DownloadDisposition,
  ) {
    const { service, contract } = await this.loadContext(serviceId);
    if (!MODERATION_ROLES.has(actor.role)) {
      this.assertParticipant(contract, actor.sub);
    }
    const proof = await this.findProof(service.id, proofId);
    if (!proof.fileId || proof.attachmentDeletedAt) {
      throw new NotFoundException('Cette preuve ne contient plus de fichier.');
    }
    return this.storageService.createLinkedDownloadUrl(
      proof.fileId,
      StorageLinkedEntityType.SERVICE_PROOF,
      proof.id,
      disposition,
    );
  }

  async deleteProofAttachment(
    serviceId: string,
    proofId: string,
    actor: AuthenticatedUser,
  ) {
    const { service, contract } = await this.loadContext(serviceId);
    this.assertNotDisputed(service, contract);
    if (!PROOFABLE_STATUSES.includes(service.status)) {
      throw new ConflictException(
        'Cette pièce jointe ne peut plus être supprimée dans le statut actuel.',
      );
    }
    const proof = await this.findProof(service.id, proofId);
    if (proof.authorId !== actor.sub) {
      throw new ForbiddenException(
        'Seul l’auteur peut supprimer cette pièce jointe.',
      );
    }
    if (!proof.fileId) {
      throw new NotFoundException('Cette preuve ne contient pas de fichier.');
    }
    const result = await this.storageService.deleteLinkedFile(
      proof.fileId,
      StorageLinkedEntityType.SERVICE_PROOF,
      proof.id,
    );
    if (!proof.attachmentDeletedAt) {
      proof.attachmentDeletedAt = result.deletedAt ?? new Date();
      await proof.save();
    }
    const [presented] = await this.presentProofs(
      [proof.toObject() as ProofRow],
      actor,
      service,
    );
    return presented;
  }

  async markDone(serviceId: string, actor: AuthenticatedUser) {
    const { service, contract } = await this.loadContext(serviceId);
    this.assertNotDisputed(service, contract);
    this.assertProvider(contract, actor.sub);
    this.assertActiveContract(contract);

    if (
      ![ServiceStatus.IN_PROGRESS, ServiceStatus.CORRECTION_REQUESTED].includes(
        service.status,
      )
    ) {
      throw new ConflictException(
        'Seul un service en cours ou à corriger peut être déclaré réalisé.',
      );
    }

    const proofFilter: Record<string, unknown> = {
      serviceId: service.id,
      authorId: contract.providerId,
    };
    if (
      service.status === ServiceStatus.CORRECTION_REQUESTED &&
      service.correctionRequestedAt
    ) {
      proofFilter.createdAt = { $gt: service.correctionRequestedAt };
    }
    const proofCount = await this.proofModel.countDocuments(proofFilter).exec();
    if (proofCount === 0) {
      throw new ConflictException(
        service.status === ServiceStatus.CORRECTION_REQUESTED
          ? 'Ajoutez une nouvelle preuve avant de déclarer la correction réalisée.'
          : 'Ajoutez au moins une preuve avant de déclarer le service réalisé.',
      );
    }

    const markedDoneAt = new Date();
    const updated = await this.serviceModel
      .findOneAndUpdate(
        {
          _id: service.id,
          status: service.status,
          contractId: contract.id,
        },
        {
          $set: {
            status: ServiceStatus.AWAITING_VALIDATION,
            markedDoneAt,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) {
      throw new ConflictException(
        'Le statut du service a changé. Actualisez la page.',
      );
    }
    return this.presentExecution(updated, contract, false);
  }

  async requestCorrection(
    serviceId: string,
    input: RequestServiceCorrectionDto,
    actor: AuthenticatedUser,
  ) {
    const { service, contract } = await this.loadContext(serviceId);
    this.assertNotDisputed(service, contract);
    this.assertRequester(contract, actor.sub);
    this.assertActiveContract(contract);

    if (service.status !== ServiceStatus.AWAITING_VALIDATION) {
      throw new ConflictException("Ce service n'attend pas de validation.");
    }

    const reason = input.reason.trim();
    if (!reason) {
      throw new BadRequestException(
        'Une raison est requise pour demander une correction.',
      );
    }

    const correctionRequestedAt = new Date();
    const updated = await this.serviceModel
      .findOneAndUpdate(
        {
          _id: service.id,
          status: ServiceStatus.AWAITING_VALIDATION,
          contractId: contract.id,
        },
        {
          $set: {
            status: ServiceStatus.CORRECTION_REQUESTED,
            correctionRequestedAt,
            correctionReason: reason,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) {
      throw new ConflictException(
        'Le statut du service a changé. Actualisez la page.',
      );
    }
    return this.presentExecution(updated, contract, false);
  }

  async validate(serviceId: string, actor: AuthenticatedUser) {
    const { service, contract } = await this.loadContext(serviceId);
    this.assertNotDisputed(service, contract);
    this.assertRequester(contract, actor.sub);

    if (
      service.status === ServiceStatus.COMPLETED &&
      contract.status === ContractStatus.COMPLETED
    ) {
      throw new ConflictException('Les points ont déjà été transférés.');
    }

    if (
      contract.status === ContractStatus.COMPLETED &&
      service.status === ServiceStatus.AWAITING_VALIDATION
    ) {
      const recovered = await this.completeServiceState(service, new Date());
      return this.presentExecution(recovered, contract, true);
    }

    this.assertActiveContract(contract);
    if (service.status !== ServiceStatus.AWAITING_VALIDATION) {
      throw new ConflictException("Ce service n'attend pas de validation.");
    }

    if (
      service.validationClaimedAt &&
      (await this.pointsService.hasFinalTransfer(contract.id))
    ) {
      const recoveredContract = await this.completeContractState(
        contract,
        new Date(),
      );
      const recoveredService = await this.completeServiceState(
        service,
        recoveredContract.completedAt ?? new Date(),
      );
      return this.presentExecution(recoveredService, recoveredContract, true);
    }

    const claimDate = new Date();
    const claimed = await this.serviceModel
      .findOneAndUpdate(
        {
          _id: service.id,
          status: ServiceStatus.AWAITING_VALIDATION,
          validationClaimedAt: null,
        },
        { $set: { validationClaimedAt: claimDate } },
        { returnDocument: 'after' },
      )
      .select('+validationClaimedAt')
      .exec();
    if (!claimed) {
      throw new ConflictException(
        'La validation de ce service est déjà en cours.',
      );
    }

    try {
      let alreadyTransferred = false;
      if (contract.pricePoints > 0) {
        const transfer = await this.pointsService.transferReservedPoints(
          contract.payerId,
          contract.receiverId,
          contract.pricePoints,
          contract.id,
          service.id,
        );
        alreadyTransferred = transfer.alreadyTransferred;
      }

      const completedAt = new Date();
      const completedContract = await this.completeContractState(
        contract,
        completedAt,
      );
      const completedService = await this.completeServiceState(
        claimed,
        completedAt,
      );
      return this.presentExecution(
        completedService,
        completedContract,
        alreadyTransferred,
      );
    } catch (error) {
      const transferExists =
        contract.pricePoints > 0 &&
        (await this.pointsService.hasFinalTransfer(contract.id));
      if (!transferExists) {
        await this.serviceModel
          .updateOne(
            { _id: service.id, validationClaimedAt: claimDate },
            { $set: { validationClaimedAt: null } },
          )
          .exec();
      }
      throw error;
    }
  }

  async validateByContract(contractId: string, actor: AuthenticatedUser) {
    this.assertValidId(contractId, 'Contrat introuvable.');
    const contract = await this.contractModel.findById(contractId).exec();
    if (!contract) throw new NotFoundException('Contrat introuvable.');
    if (contract.requesterId !== actor.sub) {
      throw new ForbiddenException(
        'Seul le demandeur peut valider le service.',
      );
    }
    return this.validate(contract.serviceId, actor);
  }

  private async loadContext(serviceId: string) {
    this.assertValidId(serviceId, 'Service introuvable.');
    const service = await this.serviceModel
      .findById(serviceId)
      .select('+validationClaimedAt')
      .exec();
    if (!service) throw new NotFoundException('Service introuvable.');

    const contract = service.contractId
      ? await this.contractModel.findById(service.contractId).exec()
      : await this.contractModel
          .findOne({
            serviceId: service.id,
            status: { $ne: ContractStatus.CANCELLED },
          })
          .exec();
    if (!contract) {
      throw new ConflictException("Ce service n'est pas associé à un contrat.");
    }
    return { service, contract };
  }

  private async presentProofs(
    proofs: ProofRow[],
    actor: AuthenticatedUser,
    service: Pick<Service, 'status'>,
  ) {
    const authors = await this.publicUsersService.findByIds(
      proofs.map((proof) => proof.authorId),
    );
    return proofs.map((proof) => {
      const id = String(proof._id);
      const deleted = Boolean(proof.attachmentDeletedAt);
      const hasAttachment = Boolean(proof.fileId || proof.fileReference);
      return {
        id,
        serviceId: proof.serviceId,
        authorId: proof.authorId,
        type: proof.type,
        message: proof.message,
        fileReference: proof.fileReference,
        fileId: proof.fileId,
        attachment: proof.fileId
          ? {
              fileId: proof.fileId,
              fileKind: proof.fileKind,
              originalFilename: proof.originalFilename,
              mimeType: proof.mimeType,
              sizeBytes: proof.sizeBytes,
              sha256: proof.sha256,
              deleted,
              deletedAt: proof.attachmentDeletedAt,
            }
          : null,
        permissions: {
          canPreview: hasAttachment && !deleted && Boolean(proof.fileId),
          canDownload: hasAttachment && !deleted && Boolean(proof.fileId),
          canDelete:
            proof.authorId === actor.sub &&
            Boolean(proof.fileId) &&
            !deleted &&
            PROOFABLE_STATUSES.includes(service.status),
        },
        createdAt: proof.createdAt,
        author: authors.get(proof.authorId) ?? null,
      };
    });
  }

  private async findProof(serviceId: string, proofId: string) {
    this.assertValidId(proofId, 'Preuve introuvable.');
    const proof = await this.proofModel
      .findOne({ _id: proofId, serviceId })
      .exec();
    if (!proof) throw new NotFoundException('Preuve introuvable.');
    return proof;
  }

  private toServiceProofType(fileKind: 'image' | 'document' | 'audio') {
    if (fileKind === 'image') return ServiceProofType.IMAGE;
    if (fileKind === 'audio') return ServiceProofType.AUDIO;
    return ServiceProofType.DOCUMENT;
  }

  private presentExecution(
    service: ServiceDocument,
    contract: ContractDocument,
    alreadyTransferred: boolean,
  ) {
    return {
      serviceId: service.id,
      contractId: contract.id,
      status: service.status,
      executionStatus: service.status,
      scheduledAt: service.scheduledAt,
      startedAt: service.startedAt,
      markedDoneAt: service.markedDoneAt,
      correctionRequestedAt: service.correctionRequestedAt,
      correctionReason: service.correctionReason,
      validatedAt: service.validatedAt,
      completedAt: service.completedAt,
      contractStatus: contract.status,
      pointsTransferred: contract.status === ContractStatus.COMPLETED,
      alreadyTransferred,
    };
  }

  private async completeContractState(
    contract: ContractDocument,
    completedAt: Date,
  ) {
    if (contract.status === ContractStatus.COMPLETED) return contract;
    const updated = await this.contractModel
      .findOneAndUpdate(
        { _id: contract.id, status: ContractStatus.ACTIVE },
        {
          $set: {
            status: ContractStatus.COMPLETED,
            completedAt,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) {
      const current = await this.contractModel.findById(contract.id).exec();
      if (current?.status === ContractStatus.COMPLETED) return current;
      throw new ConflictException(
        "Le contrat n'a pas pu être clôturé dans son statut actuel.",
      );
    }
    return updated;
  }

  private async completeServiceState(
    service: ServiceDocument,
    completedAt: Date,
  ) {
    if (service.status === ServiceStatus.COMPLETED) return service;
    const updated = await this.serviceModel
      .findOneAndUpdate(
        {
          _id: service.id,
          status: ServiceStatus.AWAITING_VALIDATION,
        },
        {
          $set: {
            status: ServiceStatus.COMPLETED,
            validatedAt: completedAt,
            completedAt,
            validationClaimedAt: null,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) {
      const current = await this.serviceModel.findById(service.id).exec();
      if (current?.status === ServiceStatus.COMPLETED) return current;
      throw new ConflictException(
        "Le service n'a pas pu être clôturé dans son statut actuel.",
      );
    }
    return updated;
  }

  private assertNotDisputed(
    service: Pick<Service, 'status' | 'activeDisputeId'>,
    contract: Pick<Contract, 'status' | 'activeDisputeId'>,
  ) {
    if (
      service.status === ServiceStatus.DISPUTED ||
      contract.status === ContractStatus.DISPUTED ||
      service.activeDisputeId ||
      contract.activeDisputeId
    ) {
      throw new ConflictException(
        'Ce service fait actuellement l’objet d’un litige.',
      );
    }
  }

  private assertActiveContract(contract: ContractDocument) {
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ConflictException(
        'Le contrat doit être actif avant le démarrage.',
      );
    }
  }

  private assertProvider(contract: ContractDocument, userId: string) {
    if (contract.providerId !== userId) {
      throw new ForbiddenException(
        'Seul le prestataire peut effectuer cette action.',
      );
    }
  }

  private assertRequester(contract: ContractDocument, userId: string) {
    if (contract.requesterId !== userId) {
      throw new ForbiddenException(
        'Seul le demandeur peut valider le service.',
      );
    }
  }

  private assertParticipant(contract: ContractDocument, userId: string) {
    if (contract.requesterId !== userId && contract.providerId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à consulter les preuves de ce service.",
      );
    }
  }

  private assertValidId(id: string, message: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(message);
    }
  }
}
