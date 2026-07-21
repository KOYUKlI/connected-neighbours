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
  ServiceStatus.AWAITING_VALIDATION,
  ServiceStatus.CORRECTION_REQUESTED,
  ServiceStatus.DISPUTED,
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
  ) {}

  async start(serviceId: string, actor: AuthenticatedUser) {
    const { service, contract } = await this.loadContext(serviceId);
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
    this.assertParticipant(contract, actor.sub);
    this.assertActiveContract(contract);

    if (!PROOFABLE_STATUSES.includes(service.status)) {
      throw new ConflictException(
        'Une preuve ne peut être ajoutée que pendant l’exécution du service.',
      );
    }

    const message = input.message?.trim() || null;
    const fileReference = input.fileReference?.trim() || null;
    if (input.type === ServiceProofType.NOTE && !message) {
      throw new BadRequestException(
        'Une description est requise pour la preuve.',
      );
    }
    if (input.type !== ServiceProofType.NOTE && !fileReference) {
      throw new BadRequestException(
        'Une référence de fichier existante est requise pour ce type de preuve.',
      );
    }

    const proof = await this.proofModel.create({
      serviceId: service.id,
      authorId: actor.sub,
      type: input.type,
      message,
      fileReference,
    });
    const [presented] = await this.presentProofs([
      proof.toObject() as ProofRow,
    ]);
    return presented;
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
    return this.presentProofs(proofs);
  }

  async markDone(serviceId: string, actor: AuthenticatedUser) {
    const { service, contract } = await this.loadContext(serviceId);
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

  private async presentProofs(proofs: ProofRow[]) {
    const authors = await this.publicUsersService.findByIds(
      proofs.map((proof) => proof.authorId),
    );
    return proofs.map((proof) => ({
      id: String(proof._id),
      serviceId: proof.serviceId,
      authorId: proof.authorId,
      type: proof.type,
      message: proof.message,
      fileReference: proof.fileReference,
      createdAt: proof.createdAt,
      author: authors.get(proof.authorId) ?? null,
    }));
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
