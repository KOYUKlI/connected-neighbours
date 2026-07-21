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
import { User, UserDocument } from '../auth/schemas/user.schema';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import { PointsService } from '../points/points.service';
import { PointTransactionType } from '../points/schemas/point-transaction.schema';
import {
  ServiceProof,
  ServiceProofDocument,
} from '../services/schemas/service-proof.schema';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { PublicUsersService } from '../users/public-users.service';
import { AssignDisputeDto } from './dto/assign-dispute.dto';
import { CreateDisputeEvidenceDto } from './dto/create-dispute-evidence.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ListAdminDisputesQueryDto } from './dto/list-admin-disputes-query.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import {
  DisputeEvidence,
  DisputeEvidenceDocument,
  DisputeEvidenceType,
} from './schemas/dispute-evidence.schema';
import {
  Dispute,
  DisputeAuditEventType,
  DisputeDocument,
  DisputeReason,
  DisputeResolution,
  DisputeResolutionType,
  DisputeStatus,
} from './schemas/dispute.schema';

const ACTIVE_DISPUTE_STATUSES = [
  DisputeStatus.OPEN,
  DisputeStatus.UNDER_REVIEW,
];
const OPENABLE_SERVICE_STATUSES = [
  ServiceStatus.IN_PROGRESS,
  ServiceStatus.AWAITING_VALIDATION,
  ServiceStatus.CORRECTION_REQUESTED,
];
const MODERATION_ROLES = new Set<Role>([Role.MODERATOR, Role.ADMIN]);

type DisputeRow = Dispute & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
type DisputeEvidenceRow = DisputeEvidence & {
  _id: unknown;
  createdAt?: Date;
};
type ServiceProofRow = ServiceProof & {
  _id: unknown;
  createdAt?: Date;
};

@Injectable()
export class DisputesService {
  constructor(
    @InjectModel(Dispute.name)
    private readonly disputeModel: Model<DisputeDocument>,
    @InjectModel(DisputeEvidence.name)
    private readonly evidenceModel: Model<DisputeEvidenceDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(ServiceProof.name)
    private readonly serviceProofModel: Model<ServiceProofDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly pointsService: PointsService,
    private readonly publicUsersService: PublicUsersService,
  ) {}

  async openForService(
    serviceId: string,
    input: CreateDisputeDto,
    actor: AuthenticatedUser,
  ) {
    const service = await this.findService(serviceId);
    const contract = await this.findContractForService(service);
    this.assertParticipant(contract, actor.sub);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ConflictException(
        'Le contrat doit être actif pour ouvrir un litige.',
      );
    }
    if (!service.isPaid || contract.pricePoints <= 0) {
      throw new ConflictException(
        'Un litige financier nécessite des points réservés.',
      );
    }
    if (
      !OPENABLE_SERVICE_STATUSES.includes(service.status) &&
      !(
        service.status === ServiceStatus.SCHEDULED &&
        input.reason === DisputeReason.NO_SHOW
      )
    ) {
      throw new ConflictException(
        "Ce service n'est pas dans un état permettant une contestation.",
      );
    }
    if (
      service.activeDisputeId ||
      contract.activeDisputeId ||
      (await this.findActiveForContract(contract.id))
    ) {
      throw new ConflictException('Un litige est déjà ouvert pour ce contrat.');
    }
    if (await this.pointsService.hasFinalTransfer(contract.id)) {
      throw new ConflictException(
        'Les points ont déjà été transférés pour ce service.',
      );
    }
    if (
      !(await this.pointsService.hasReservedPoints(
        contract.payerId,
        contract.pricePoints,
      ))
    ) {
      throw new ConflictException(
        'Les points réservés ne sont plus disponibles pour ce contrat.',
      );
    }

    const disputeId = new Types.ObjectId().toString();
    const previousServiceStatus = service.status;
    const openedAt = new Date();
    const serviceClaim = await this.serviceModel
      .findOneAndUpdate(
        {
          _id: service.id,
          status: previousServiceStatus,
          $or: [
            { activeDisputeId: null },
            { activeDisputeId: { $exists: false } },
          ],
        },
        {
          $set: {
            activeDisputeId: disputeId,
            status: ServiceStatus.DISPUTED,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!serviceClaim) {
      throw new ConflictException('Un litige est déjà ouvert pour ce service.');
    }

    const contractClaim = await this.contractModel
      .findOneAndUpdate(
        {
          _id: contract.id,
          status: ContractStatus.ACTIVE,
          $or: [
            { activeDisputeId: null },
            { activeDisputeId: { $exists: false } },
          ],
        },
        {
          $set: {
            activeDisputeId: disputeId,
            status: ContractStatus.DISPUTED,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!contractClaim) {
      await this.restoreOpeningClaims(
        disputeId,
        service.id,
        contract.id,
        previousServiceStatus,
      );
      throw new ConflictException(
        'Le contrat a changé. Actualisez la page avant de réessayer.',
      );
    }

    try {
      const dispute = await this.disputeModel.create({
        _id: disputeId,
        serviceId: service.id,
        contractId: contract.id,
        openedById: actor.sub,
        reason: input.reason,
        description: input.description.trim(),
        requestedOutcome: input.requestedOutcome ?? null,
        status: DisputeStatus.OPEN,
        assignedModeratorId: null,
        previousServiceStatus,
        reservedPoints: contract.pricePoints,
        openedAt,
        assignedAt: null,
        reviewStartedAt: null,
        resolvedAt: null,
        closedAt: null,
        resolution: null,
        resolutionClaimedAt: null,
        history: [
          this.auditEvent(DisputeAuditEventType.OPENED, actor.sub, openedAt, {
            previousServiceStatus,
            reservedPoints: contract.pricePoints,
          }),
        ],
      });
      return this.presentDispute(dispute, actor);
    } catch (error) {
      await this.restoreOpeningClaims(
        disputeId,
        service.id,
        contract.id,
        previousServiceStatus,
      );
      if (this.isDuplicateKey(error)) {
        throw new ConflictException(
          'Un litige est déjà ouvert pour ce contrat.',
        );
      }
      throw error;
    }
  }

  async findMine(actor: AuthenticatedUser) {
    const contracts = await this.contractModel
      .find({
        $or: [{ requesterId: actor.sub }, { providerId: actor.sub }],
      })
      .select('_id')
      .lean<Array<{ _id: unknown }>>()
      .exec();
    const contractIds = contracts.map((contract) => String(contract._id));
    const disputes = await this.disputeModel
      .find({
        $or: [{ openedById: actor.sub }, { contractId: { $in: contractIds } }],
      })
      .sort({ openedAt: -1, _id: -1 })
      .lean<DisputeRow[]>()
      .exec();
    return this.presentDisputeList(disputes, actor);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const dispute = await this.findDispute(id, true);
    const contract = await this.findContract(dispute.contractId);
    this.assertCanView(contract, actor);
    return this.presentDispute(dispute, actor, contract);
  }

  async addEvidence(
    id: string,
    input: CreateDisputeEvidenceDto,
    actor: AuthenticatedUser,
  ) {
    const dispute = await this.findDispute(id);
    const contract = await this.findContract(dispute.contractId);
    const canModerate = MODERATION_ROLES.has(actor.role);
    if (!canModerate) this.assertParticipant(contract, actor.sub);
    if (dispute.status === DisputeStatus.CLOSED) {
      throw new ConflictException(
        'Ce litige est clôturé et ne peut plus recevoir de preuve.',
      );
    }

    const message = input.message?.trim() || null;
    const fileReference = input.fileReference?.trim() || null;
    if (input.type === DisputeEvidenceType.NOTE && !message) {
      throw new BadRequestException(
        'Une description est requise pour la preuve.',
      );
    }
    if (input.type !== DisputeEvidenceType.NOTE && !fileReference) {
      throw new BadRequestException(
        'Une référence de fichier existante est requise pour ce type de preuve.',
      );
    }

    const evidence = await this.evidenceModel.create({
      disputeId: dispute.id,
      authorId: actor.sub,
      type: input.type,
      message,
      fileReference,
    });
    const occurredAt = new Date();
    await this.disputeModel
      .updateOne(
        { _id: dispute.id, status: { $ne: DisputeStatus.CLOSED } },
        {
          $push: {
            history: this.auditEvent(
              DisputeAuditEventType.EVIDENCE_ADDED,
              actor.sub,
              occurredAt,
              { evidenceId: evidence.id, evidenceType: input.type },
            ),
          },
        },
      )
      .exec();
    const [presented] = await this.presentEvidence([
      evidence.toObject() as DisputeEvidenceRow,
    ]);
    return presented;
  }

  async findEvidence(id: string, actor: AuthenticatedUser) {
    const dispute = await this.findDispute(id);
    const contract = await this.findContract(dispute.contractId);
    this.assertCanView(contract, actor);
    const evidence = await this.evidenceModel
      .find({ disputeId: dispute.id })
      .sort({ createdAt: 1, _id: 1 })
      .lean<DisputeEvidenceRow[]>()
      .exec();
    return this.presentEvidence(evidence);
  }
  async findAdmin(query: ListAdminDisputesQueryDto, actor: AuthenticatedUser) {
    this.assertModerator(actor);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const filters: Array<Record<string, unknown>> = [];
    if (query.status) filters.push({ status: query.status });
    if (query.reason) filters.push({ reason: query.reason });
    if (query.moderatorId) {
      filters.push({ assignedModeratorId: query.moderatorId });
    }

    if (query.neighborhoodId) {
      const serviceIds = await this.serviceModel
        .find({ neighborhoodId: query.neighborhoodId })
        .distinct('_id')
        .exec();
      filters.push({ serviceId: { $in: serviceIds.map(String) } });
    }

    if (query.search?.trim()) {
      const pattern = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      const serviceIds = await this.serviceModel
        .find({ title: pattern })
        .distinct('_id')
        .exec();
      filters.push({
        $or: [
          { description: pattern },
          { serviceId: { $in: serviceIds.map(String) } },
        ],
      });
    }

    const filter = filters.length === 0 ? {} : { $and: filters };
    const [rows, total] = await Promise.all([
      this.disputeModel
        .find(filter)
        .sort({ openedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<DisputeRow[]>()
        .exec(),
      this.disputeModel.countDocuments(filter).exec(),
    ]);

    return {
      items: await this.presentDisputeList(rows, actor),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async assign(id: string, input: AssignDisputeDto, actor: AuthenticatedUser) {
    this.assertModerator(actor);
    const moderatorId = input.moderatorId ?? actor.sub;
    if (actor.role === Role.MODERATOR && moderatorId !== actor.sub) {
      throw new ForbiddenException(
        'Un modérateur peut uniquement s’assigner le litige.',
      );
    }
    const moderator = await this.userModel
      .findOne({
        _id: moderatorId,
        isActive: true,
        role: { $in: [Role.MODERATOR, Role.ADMIN] },
      })
      .select('_id role')
      .lean()
      .exec();
    if (!moderator) {
      throw new BadRequestException(
        'Le compte choisi ne peut pas traiter ce litige.',
      );
    }

    const assignedAt = new Date();
    const updated = await this.disputeModel
      .findOneAndUpdate(
        {
          _id: this.toObjectId(id),
          status: { $in: ACTIVE_DISPUTE_STATUSES },
        },
        {
          $set: { assignedModeratorId: moderatorId, assignedAt },
          $push: {
            history: this.auditEvent(
              DisputeAuditEventType.MODERATOR_ASSIGNED,
              actor.sub,
              assignedAt,
              { moderatorId },
            ),
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) {
      throw new ConflictException(
        'Ce litige ne peut plus être assigné dans son statut actuel.',
      );
    }
    return this.presentDispute(updated, actor);
  }

  async startReview(id: string, actor: AuthenticatedUser) {
    this.assertModerator(actor);
    const dispute = await this.findDispute(id);
    this.assertAssignedModerator(dispute, actor);
    if (!dispute.assignedModeratorId) {
      throw new ConflictException(
        'Le litige doit être assigné avant le début de la revue.',
      );
    }

    const reviewStartedAt = new Date();
    const updated = await this.disputeModel
      .findOneAndUpdate(
        { _id: dispute.id, status: DisputeStatus.OPEN },
        {
          $set: {
            status: DisputeStatus.UNDER_REVIEW,
            reviewStartedAt,
          },
          $push: {
            history: this.auditEvent(
              DisputeAuditEventType.REVIEW_STARTED,
              actor.sub,
              reviewStartedAt,
            ),
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) {
      if (dispute.status === DisputeStatus.UNDER_REVIEW) {
        throw new ConflictException('La revue de ce litige a déjà commencé.');
      }
      throw new ConflictException(
        'Ce litige ne peut pas passer en revue dans son statut actuel.',
      );
    }
    return this.presentDispute(updated, actor);
  }

  async resolve(
    id: string,
    input: ResolveDisputeDto,
    actor: AuthenticatedUser,
  ) {
    this.assertModerator(actor);
    const dispute = await this.findDispute(id, true);
    this.assertAssignedModerator(dispute, actor);
    if (!ACTIVE_DISPUTE_STATUSES.includes(dispute.status)) {
      throw new ConflictException('Ce litige a déjà été résolu.');
    }
    const contract = await this.findContract(dispute.contractId);
    const service = await this.findService(dispute.serviceId);
    if (
      contract.status !== ContractStatus.DISPUTED ||
      service.status !== ServiceStatus.DISPUTED ||
      contract.activeDisputeId !== dispute.id ||
      service.activeDisputeId !== dispute.id
    ) {
      throw new ConflictException(
        'Le service et le contrat ne sont plus verrouillés par ce litige.',
      );
    }

    const amounts = this.resolveAmounts(input, dispute.reservedPoints);
    const resolvedAt = new Date();
    const resolution: DisputeResolution = {
      type: input.type,
      justification: input.justification.trim(),
      providerPoints: amounts.providerPoints,
      requesterPoints: amounts.requesterPoints,
      resolvedById: actor.sub,
      resolvedAt,
    };

    const claimed = await this.disputeModel
      .findOneAndUpdate(
        {
          _id: dispute.id,
          status: { $in: ACTIVE_DISPUTE_STATUSES },
          resolutionClaimedAt: null,
        },
        {
          $set: {
            resolutionClaimedAt: resolvedAt,
            resolution,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .select('+resolutionClaimedAt')
      .exec();

    if (!claimed) {
      const current = await this.findDispute(id, true);
      if (
        !current.resolutionClaimedAt ||
        !this.sameResolution(current.resolution, resolution)
      ) {
        throw new ConflictException(
          'Une autre résolution est déjà en cours pour ce litige.',
        );
      }
    }

    const metadata = {
      disputeId: dispute.id,
      disputeResolutionType: input.type,
    };

    if (amounts.providerPoints > 0) {
      await this.pointsService.transferReservedPoints(
        contract.payerId,
        contract.receiverId,
        amounts.providerPoints,
        contract.id,
        service.id,
        metadata,
      );
    }
    if (amounts.requesterPoints > 0) {
      await this.pointsService.releaseReservedPoints(
        contract.payerId,
        amounts.requesterPoints,
        contract.id,
        service.id,
        metadata,
      );
    }

    await this.assertFinancialResolutionComplete(
      dispute.id,
      contract.id,
      amounts,
    );
    await this.completeDisputedResources(
      dispute.id,
      service,
      contract,
      input.type,
      resolvedAt,
    );

    const updated = await this.disputeModel
      .findOneAndUpdate(
        {
          _id: dispute.id,
          status: { $in: ACTIVE_DISPUTE_STATUSES },
        },
        {
          $set: {
            status: DisputeStatus.RESOLVED,
            resolution,
            resolvedAt,
          },
          $push: {
            history: {
              $each: [
                this.auditEvent(
                  DisputeAuditEventType.FINANCIAL_OPERATION_COMPLETED,
                  actor.sub,
                  resolvedAt,
                  {
                    providerPoints: amounts.providerPoints,
                    requesterPoints: amounts.requesterPoints,
                    resolutionType: input.type,
                  },
                ),
                this.auditEvent(
                  DisputeAuditEventType.RESOLVED,
                  actor.sub,
                  resolvedAt,
                  { resolutionType: input.type },
                ),
              ],
            },
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!updated) {
      const current = await this.findDispute(id);
      if (
        [DisputeStatus.RESOLVED, DisputeStatus.CLOSED].includes(current.status)
      ) {
        return this.presentDispute(current, actor);
      }
      throw new ConflictException(
        "La résolution financière est enregistrée mais l'état du litige doit être repris.",
      );
    }
    return this.presentDispute(updated, actor);
  }

  async close(id: string, actor: AuthenticatedUser) {
    this.assertModerator(actor);
    const dispute = await this.findDispute(id);
    this.assertAssignedModerator(dispute, actor);
    const closedAt = new Date();
    const updated = await this.disputeModel
      .findOneAndUpdate(
        { _id: dispute.id, status: DisputeStatus.RESOLVED },
        {
          $set: {
            status: DisputeStatus.CLOSED,
            closedAt,
          },
          $push: {
            history: this.auditEvent(
              DisputeAuditEventType.CLOSED,
              actor.sub,
              closedAt,
            ),
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) {
      if (dispute.status === DisputeStatus.CLOSED) {
        throw new ConflictException('Ce litige est déjà clôturé.');
      }
      throw new ConflictException('Seul un litige résolu peut être clôturé.');
    }
    return this.presentDispute(updated, actor);
  }
  private async completeDisputedResources(
    disputeId: string,
    service: ServiceDocument,
    contract: ContractDocument,
    type: DisputeResolutionType,
    resolvedAt: Date,
  ) {
    const isRefund = type === DisputeResolutionType.REQUESTER_REFUND;
    const serviceStatus = isRefund
      ? ServiceStatus.CANCELLED
      : ServiceStatus.COMPLETED;
    const contractStatus = isRefund
      ? ContractStatus.CANCELLED
      : ContractStatus.COMPLETED;

    const [updatedService, updatedContract] = await Promise.all([
      this.serviceModel
        .findOneAndUpdate(
          {
            _id: service.id,
            status: ServiceStatus.DISPUTED,
            activeDisputeId: disputeId,
          },
          {
            $set: {
              status: serviceStatus,
              activeDisputeId: null,
              ...(isRefund
                ? {}
                : {
                    validatedAt: resolvedAt,
                    completedAt: resolvedAt,
                  }),
            },
          },
          { returnDocument: 'after', runValidators: true },
        )
        .exec(),
      this.contractModel
        .findOneAndUpdate(
          {
            _id: contract.id,
            status: ContractStatus.DISPUTED,
            activeDisputeId: disputeId,
          },
          {
            $set: {
              status: contractStatus,
              activeDisputeId: null,
              completedAt: isRefund ? null : resolvedAt,
            },
          },
          { returnDocument: 'after', runValidators: true },
        )
        .exec(),
    ]);

    if (!updatedService) {
      const current = await this.serviceModel.findById(service.id).exec();
      if (current?.status !== serviceStatus) {
        throw new ConflictException(
          "Le service n'a pas pu être finalisé après la décision.",
        );
      }
    }
    if (!updatedContract) {
      const current = await this.contractModel.findById(contract.id).exec();
      if (current?.status !== contractStatus) {
        throw new ConflictException(
          "Le contrat n'a pas pu être finalisé après la décision.",
        );
      }
    }
  }

  private async assertFinancialResolutionComplete(
    disputeId: string,
    contractId: string,
    amounts: { providerPoints: number; requesterPoints: number },
  ) {
    const [transferComplete, refundComplete] = await Promise.all([
      amounts.providerPoints === 0
        ? true
        : this.pointsService.hasPointOperation(
            contractId,
            PointTransactionType.TRANSFER,
            disputeId,
          ),
      amounts.requesterPoints === 0
        ? true
        : this.pointsService.hasPointOperation(
            contractId,
            PointTransactionType.RELEASE,
            disputeId,
          ),
    ]);
    if (!transferComplete || !refundComplete) {
      throw new ConflictException(
        "La résolution financière n'a pas pu être confirmée.",
      );
    }
  }

  private resolveAmounts(input: ResolveDisputeDto, reservedPoints: number) {
    if (input.type === DisputeResolutionType.PROVIDER_PAYMENT) {
      return { providerPoints: reservedPoints, requesterPoints: 0 };
    }
    if (input.type === DisputeResolutionType.REQUESTER_REFUND) {
      return { providerPoints: 0, requesterPoints: reservedPoints };
    }

    const providerPoints = input.providerPoints;
    const requesterPoints = input.requesterPoints;
    if (
      providerPoints === undefined ||
      requesterPoints === undefined ||
      providerPoints < 0 ||
      requesterPoints < 0 ||
      providerPoints + requesterPoints !== reservedPoints
    ) {
      throw new BadRequestException(
        'Le partage doit correspondre exactement au montant réservé.',
      );
    }
    return { providerPoints, requesterPoints };
  }

  private async presentDisputeList(
    disputes: DisputeRow[],
    actor: AuthenticatedUser,
  ) {
    if (disputes.length === 0) return [];
    const serviceIds = [...new Set(disputes.map((item) => item.serviceId))];
    const contractIds = [...new Set(disputes.map((item) => item.contractId))];
    const [services, contracts] = await Promise.all([
      this.serviceModel
        .find({ _id: { $in: serviceIds } })
        .select('_id title status neighborhoodId')
        .lean<Array<Service & { _id: unknown }>>()
        .exec(),
      this.contractModel
        .find({ _id: { $in: contractIds } })
        .select('_id requesterId providerId pricePoints status activeDisputeId')
        .lean<Array<Contract & { _id: unknown }>>()
        .exec(),
    ]);
    const serviceById = new Map(
      services.map((service) => [String(service._id), service]),
    );
    const contractById = new Map(
      contracts.map((contract) => [String(contract._id), contract]),
    );
    const profiles = await this.publicUsersService.findByIds([
      ...contracts.flatMap((contract) => [
        contract.requesterId,
        contract.providerId,
      ]),
      ...disputes.flatMap((dispute) => [
        dispute.openedById,
        dispute.assignedModeratorId ?? '',
      ]),
    ]);

    return disputes.map((dispute) => {
      const contract = contractById.get(dispute.contractId);
      const service = serviceById.get(dispute.serviceId);
      return {
        id: String(dispute._id),
        serviceId: dispute.serviceId,
        contractId: dispute.contractId,
        reason: dispute.reason,
        requestedOutcome: dispute.requestedOutcome,
        status: dispute.status,
        reservedPoints: dispute.reservedPoints,
        openedAt: dispute.openedAt,
        resolvedAt: dispute.resolvedAt,
        updatedAt: dispute.updatedAt,
        service: service
          ? {
              id: String(service._id),
              title: service.title,
              status: service.status,
              neighborhoodId: service.neighborhoodId,
            }
          : null,
        requester: contract
          ? (profiles.get(contract.requesterId) ?? null)
          : null,
        provider: contract ? (profiles.get(contract.providerId) ?? null) : null,
        openedBy: profiles.get(dispute.openedById) ?? null,
        assignedModerator: dispute.assignedModeratorId
          ? (profiles.get(dispute.assignedModeratorId) ?? null)
          : null,
        nextAction: this.getNextAction(dispute, contract, actor),
      };
    });
  }
  private async presentDispute(
    dispute: DisputeDocument,
    actor: AuthenticatedUser,
    loadedContract?: ContractDocument,
  ) {
    const contract =
      loadedContract ?? (await this.findContract(dispute.contractId));
    const service = await this.findService(dispute.serviceId);
    const [evidence, serviceProofs] = await Promise.all([
      this.evidenceModel
        .find({ disputeId: dispute.id })
        .sort({ createdAt: 1, _id: 1 })
        .lean<DisputeEvidenceRow[]>()
        .exec(),
      this.serviceProofModel
        .find({ serviceId: dispute.serviceId })
        .sort({ createdAt: 1, _id: 1 })
        .lean<ServiceProofRow[]>()
        .exec(),
    ]);
    const profiles = await this.publicUsersService.findByIds([
      contract.requesterId,
      contract.providerId,
      dispute.openedById,
      dispute.assignedModeratorId ?? '',
      ...evidence.map((item) => item.authorId),
      ...serviceProofs.map((item) => item.authorId),
      ...dispute.history.map((event) => event.actorId),
    ]);
    const isParticipant = this.isParticipant(contract, actor.sub);
    const canModerate = MODERATION_ROLES.has(actor.role);
    const isAssigned =
      dispute.assignedModeratorId === actor.sub || actor.role === Role.ADMIN;
    const isActive = ACTIVE_DISPUTE_STATUSES.includes(dispute.status);

    return {
      id: dispute.id,
      serviceId: dispute.serviceId,
      contractId: dispute.contractId,
      openedById: dispute.openedById,
      reason: dispute.reason,
      description: dispute.description,
      requestedOutcome: dispute.requestedOutcome,
      status: dispute.status,
      assignedModeratorId: dispute.assignedModeratorId,
      previousServiceStatus: dispute.previousServiceStatus,
      reservedPoints: dispute.reservedPoints,
      openedAt: dispute.openedAt,
      assignedAt: dispute.assignedAt,
      reviewStartedAt: dispute.reviewStartedAt,
      resolvedAt: dispute.resolvedAt,
      closedAt: dispute.closedAt,
      createdAt: (dispute as DisputeDocument & { createdAt?: Date }).createdAt,
      updatedAt: (dispute as DisputeDocument & { updatedAt?: Date }).updatedAt,
      resolution: dispute.resolution,
      service: {
        id: service.id,
        title: service.title,
        status: service.status,
        neighborhoodId: service.neighborhoodId,
      },
      contract: {
        id: contract.id,
        status: contract.status,
        pricePoints: contract.pricePoints,
      },
      requester: profiles.get(contract.requesterId) ?? null,
      provider: profiles.get(contract.providerId) ?? null,
      openedBy: profiles.get(dispute.openedById) ?? null,
      assignedModerator: dispute.assignedModeratorId
        ? (profiles.get(dispute.assignedModeratorId) ?? null)
        : null,
      evidence: await this.presentEvidence(evidence, profiles),
      serviceProofs: serviceProofs.map((proof) => ({
        id: String(proof._id),
        serviceId: proof.serviceId,
        type: proof.type,
        message: proof.message,
        fileReference: proof.fileReference,
        createdAt: proof.createdAt,
        author: profiles.get(proof.authorId) ?? null,
      })),
      history: dispute.history.map((event) => ({
        type: event.type,
        occurredAt: event.occurredAt,
        metadata: event.metadata,
        actor: profiles.get(event.actorId) ?? null,
      })),
      nextAction: this.getNextAction(dispute, contract, actor),
      permissions: {
        canViewDispute: isParticipant || canModerate,
        canAddDisputeEvidence:
          (isParticipant || canModerate) &&
          dispute.status !== DisputeStatus.CLOSED,
        canAssignDispute: canModerate && isActive,
        canStartReview:
          canModerate &&
          isAssigned &&
          Boolean(dispute.assignedModeratorId) &&
          dispute.status === DisputeStatus.OPEN,
        canResolveDispute: canModerate && isAssigned && isActive,
        canCloseDispute:
          canModerate &&
          isAssigned &&
          dispute.status === DisputeStatus.RESOLVED,
      },
    };
  }

  private async presentEvidence(
    evidence: DisputeEvidenceRow[],
    existingProfiles?: Awaited<ReturnType<PublicUsersService['findByIds']>>,
  ) {
    const profiles =
      existingProfiles ??
      (await this.publicUsersService.findByIds(
        evidence.map((item) => item.authorId),
      ));
    return evidence.map((item) => ({
      id: String(item._id),
      disputeId: item.disputeId,
      type: item.type,
      message: item.message,
      fileReference: item.fileReference,
      createdAt: item.createdAt,
      author: profiles.get(item.authorId) ?? null,
    }));
  }

  private getNextAction(
    dispute: Pick<Dispute, 'status' | 'assignedModeratorId' | 'openedById'>,
    contract: Pick<Contract, 'requesterId' | 'providerId'> | undefined,
    actor: AuthenticatedUser,
  ) {
    if (
      MODERATION_ROLES.has(actor.role) &&
      dispute.status === DisputeStatus.OPEN &&
      !dispute.assignedModeratorId
    ) {
      return 'assign_dispute';
    }
    if (
      MODERATION_ROLES.has(actor.role) &&
      dispute.status === DisputeStatus.OPEN &&
      (actor.role === Role.ADMIN || dispute.assignedModeratorId === actor.sub)
    ) {
      return 'start_review';
    }
    if (
      MODERATION_ROLES.has(actor.role) &&
      dispute.status === DisputeStatus.UNDER_REVIEW &&
      (actor.role === Role.ADMIN || dispute.assignedModeratorId === actor.sub)
    ) {
      return 'resolve_dispute';
    }
    if (
      contract &&
      this.isParticipant(contract, actor.sub) &&
      ACTIVE_DISPUTE_STATUSES.includes(dispute.status)
    ) {
      return 'add_evidence';
    }
    if (dispute.status === DisputeStatus.RESOLVED) {
      return MODERATION_ROLES.has(actor.role)
        ? 'close_dispute'
        : 'review_resolution';
    }
    return null;
  }

  private async restoreOpeningClaims(
    disputeId: string,
    serviceId: string,
    contractId: string,
    previousServiceStatus: ServiceStatus,
  ) {
    await Promise.all([
      this.serviceModel
        .updateOne(
          { _id: serviceId, activeDisputeId: disputeId },
          {
            $set: {
              activeDisputeId: null,
              status: previousServiceStatus,
            },
          },
        )
        .exec(),
      this.contractModel
        .updateOne(
          { _id: contractId, activeDisputeId: disputeId },
          {
            $set: {
              activeDisputeId: null,
              status: ContractStatus.ACTIVE,
            },
          },
        )
        .exec(),
    ]);
  }

  private async findActiveForContract(contractId: string) {
    return this.disputeModel
      .findOne({
        contractId,
        status: { $in: ACTIVE_DISPUTE_STATUSES },
      })
      .select('_id')
      .lean()
      .exec();
  }

  private async findDispute(id: string, includeClaim = false) {
    const objectId = this.toObjectId(id);
    const query = this.disputeModel.findById(objectId);
    if (includeClaim) query.select('+resolutionClaimedAt');
    const dispute = await query.exec();
    if (!dispute) throw new NotFoundException('Litige introuvable.');
    return dispute;
  }

  private async findService(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Service introuvable.');
    }
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service introuvable.');
    return service;
  }

  private async findContract(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Contrat introuvable.');
    }
    const contract = await this.contractModel.findById(id).exec();
    if (!contract) throw new NotFoundException('Contrat introuvable.');
    return contract;
  }

  private async findContractForService(service: ServiceDocument) {
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
    return contract;
  }

  private assertCanView(
    contract: Pick<Contract, 'requesterId' | 'providerId'>,
    actor: AuthenticatedUser,
  ) {
    if (
      !this.isParticipant(contract, actor.sub) &&
      !MODERATION_ROLES.has(actor.role)
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à consulter ce litige.",
      );
    }
  }

  private assertParticipant(
    contract: Pick<Contract, 'requesterId' | 'providerId'>,
    userId: string,
  ) {
    if (!this.isParticipant(contract, userId)) {
      throw new ForbiddenException(
        'Seules les parties au contrat peuvent ouvrir un litige.',
      );
    }
  }

  private isParticipant(
    contract: Pick<Contract, 'requesterId' | 'providerId'>,
    userId: string,
  ) {
    return contract.requesterId === userId || contract.providerId === userId;
  }

  private assertModerator(actor: AuthenticatedUser) {
    if (!MODERATION_ROLES.has(actor.role)) {
      throw new ForbiddenException(
        'Cette action est réservée à la modération.',
      );
    }
  }

  private assertAssignedModerator(
    dispute: Pick<Dispute, 'assignedModeratorId'>,
    actor: AuthenticatedUser,
  ) {
    if (
      actor.role !== Role.ADMIN &&
      dispute.assignedModeratorId !== actor.sub
    ) {
      throw new ForbiddenException(
        'Seul le modérateur assigné peut effectuer cette action.',
      );
    }
  }

  private auditEvent(
    type: DisputeAuditEventType,
    actorId: string,
    occurredAt: Date,
    metadata: Record<string, string | number | boolean | null> = {},
  ) {
    return { type, actorId, occurredAt, metadata };
  }

  private sameResolution(
    current: DisputeResolution | null,
    expected: DisputeResolution,
  ) {
    return (
      current?.type === expected.type &&
      current.providerPoints === expected.providerPoints &&
      current.requesterPoints === expected.requesterPoints &&
      current.justification === expected.justification
    );
  }

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Litige introuvable.');
    }
    return new Types.ObjectId(id);
  }

  private isDuplicateKey(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    );
  }

  private escapeRegex(value: string) {
    return value.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
  }
}
