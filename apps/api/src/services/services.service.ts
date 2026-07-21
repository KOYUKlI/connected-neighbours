import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ServiceApplication,
  ServiceApplicationDocument,
  ServiceApplicationStatus,
} from '../applications/schemas/service-application.schema';
import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';
import {
  Dispute,
  DisputeDocument,
  DisputeStatus,
} from '../disputes/schemas/dispute.schema';
import {
  Neighborhood,
  NeighborhoodDocument,
  NeighborhoodStatus,
} from '../neighborhoods/schemas/neighborhood.schema';
import { PublicUsersService } from '../users/public-users.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import {
  ServiceProof,
  ServiceProofDocument,
} from './schemas/service-proof.schema';
import { NeighborhoodSummary, ServiceResponse } from './service-response.type';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from './schemas/service.schema';

const PUBLIC_SERVICE_STATUSES = [
  ServiceStatus.PUBLISHED,
  ServiceStatus.APPLICATION_RECEIVED,
];
const EDITABLE_SERVICE_STATUSES = new Set<ServiceStatus>([
  ServiceStatus.DRAFT,
  ServiceStatus.PUBLISHED,
  ServiceStatus.APPLICATION_RECEIVED,
]);
const CANCELLABLE_SERVICE_STATUSES = new Set<ServiceStatus>([
  ServiceStatus.DRAFT,
  ServiceStatus.PUBLISHED,
  ServiceStatus.APPLICATION_RECEIVED,
]);

type ServiceActor = Pick<AuthenticatedUser, 'sub' | 'role'>;
export type ServiceRow = Service & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
type NeighborhoodRow = Neighborhood & { _id: unknown };
type ApplicationCountRow = { _id: string; count: number };
type ProofCountRow = { _id: string; count: number };
type ViewerApplicationRow = ServiceApplication & {
  _id: unknown;
  createdAt?: Date;
};
type ContractRow = Contract & { _id: unknown; createdAt?: Date };
type DisputeRow = Dispute & { _id: unknown; createdAt?: Date };
type EnrichmentContext = {
  owners: Awaited<ReturnType<PublicUsersService['findByIds']>>;
  neighborhoods: Map<string, NeighborhoodSummary>;
  applicationCounts: Map<string, number>;
  proofCounts: Map<string, number>;
  viewerApplications: Map<string, ViewerApplicationRow>;
  viewerContracts: Map<string, ContractRow>;
  activeDisputes: Map<string, DisputeRow>;
};
type ServiceFilter = Record<string, unknown>;

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    @InjectModel(ServiceApplication.name)
    private readonly applicationModel: Model<ServiceApplicationDocument>,
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Dispute.name)
    private readonly disputeModel: Model<DisputeDocument>,
    @InjectModel(ServiceProof.name)
    private readonly proofModel: Model<ServiceProofDocument>,
    private readonly publicUsersService: PublicUsersService,
  ) {}

  async create(createServiceDto: CreateServiceDto, ownerId: string) {
    await this.assertNeighborhoodCanBeUsed(createServiceDto.neighborhoodId);
    if (
      createServiceDto.status &&
      ![ServiceStatus.DRAFT, ServiceStatus.PUBLISHED].includes(
        createServiceDto.status,
      )
    ) {
      throw new BadRequestException(
        'Un service doit etre cree comme brouillon ou publie.',
      );
    }

    return this.serviceModel.create({
      ...createServiceDto,
      ownerId,
      status: createServiceDto.status ?? ServiceStatus.PUBLISHED,
      pricePoints: createServiceDto.isPaid
        ? (createServiceDto.pricePoints ?? 0)
        : null,
    });
  }

  async findAll(query: ListServicesQueryDto, actor: AuthenticatedUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const rows = await this.serviceModel
      .find(this.buildListFilter(query, actor))
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<ServiceRow[]>()
      .exec();
    return this.presentServices(rows, actor);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const row = await this.findRawRow(id);
    const [presented] = await this.presentServices([row], actor);
    const canSee =
      presented.viewer.isOwner ||
      PUBLIC_SERVICE_STATUSES.includes(presented.status) ||
      presented.viewer.hasApplied ||
      presented.permissions.canViewContract;
    if (!canSee) throw new NotFoundException('Service introuvable.');
    return presented;
  }

  async findCreatedByUser(actor: AuthenticatedUser) {
    const rows = await this.serviceModel
      .find({ ownerId: actor.sub })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<ServiceRow[]>()
      .exec();
    return this.presentServices(rows, actor);
  }

  async findInvolvedByUser(actor: AuthenticatedUser) {
    const [applications, contracts] = await Promise.all([
      this.applicationModel
        .find({ applicantId: actor.sub })
        .select('serviceId status')
        .lean<ViewerApplicationRow[]>()
        .exec(),
      this.contractModel
        .find({
          $or: [{ requesterId: actor.sub }, { providerId: actor.sub }],
        })
        .select('serviceId requesterId providerId status signedByIds')
        .lean<ContractRow[]>()
        .exec(),
    ]);
    const serviceIds = [
      ...new Set([
        ...applications.map((entry) => entry.serviceId),
        ...contracts.map((entry) => entry.serviceId),
      ]),
    ];
    if (serviceIds.length === 0) return [];

    const rows = await this.serviceModel
      .find({
        _id: { $in: serviceIds.filter((id) => Types.ObjectId.isValid(id)) },
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean<ServiceRow[]>()
      .exec();
    const presented = await this.presentServices(rows, actor);
    const applicationByService = new Map(
      applications.map((entry) => [entry.serviceId, entry]),
    );
    const contractByService = new Map(
      contracts.map((entry) => [entry.serviceId, entry]),
    );

    return presented.map((service) => {
      const application = applicationByService.get(service.id);
      const contract = contractByService.get(service.id);
      return {
        ...service,
        involvement: {
          role:
            contract?.providerId === actor.sub
              ? 'provider'
              : contract?.requesterId === actor.sub
                ? 'requester'
                : 'applicant',
          applicationStatus: application?.status ?? null,
          contractStatus: contract?.status ?? null,
          nextAction: this.getNextInvolvementAction(
            actor.sub,
            application,
            contract,
            service.status,
          ),
        },
      };
    });
  }

  async presentServices(
    rows: ServiceRow[],
    actor: AuthenticatedUser,
  ): Promise<ServiceResponse[]> {
    if (rows.length === 0) return [];
    const context = await this.loadEnrichmentContext(rows, actor.sub);
    return rows.map((row) => this.presentService(row, actor, context));
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    actor: ServiceActor,
  ) {
    const service = await this.findRawDocument(id);
    this.assertOwner(service, actor);
    if (
      !EDITABLE_SERVICE_STATUSES.has(service.status) ||
      service.contractId ||
      service.selectedApplicationId
    ) {
      throw new ConflictException(
        'Ce service ne peut plus etre modifie dans son statut actuel.',
      );
    }

    const payload = { ...updateServiceDto };
    if (payload.neighborhoodId) {
      await this.assertNeighborhoodCanBeUsed(payload.neighborhoodId);
    }
    if (payload.isPaid === false) payload.pricePoints = null;
    if (
      payload.isPaid === true &&
      payload.pricePoints === undefined &&
      !service.isPaid
    ) {
      throw new BadRequestException(
        'Un prix en points est requis pour un service payant.',
      );
    }

    const updated = await this.serviceModel
      .findByIdAndUpdate(id, payload, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    if (!updated) throw new NotFoundException('Service introuvable.');
    return updated;
  }

  async publish(id: string, actor: ServiceActor) {
    const service = await this.findRawDocument(id);
    this.assertOwner(service, actor);
    if (service.status === ServiceStatus.PUBLISHED) return service;
    if (service.status !== ServiceStatus.DRAFT) {
      throw new ConflictException(
        'Seul un service en brouillon peut etre publie.',
      );
    }
    return this.updateStatus(id, ServiceStatus.PUBLISHED);
  }

  async cancel(id: string, actor: ServiceActor) {
    const service = await this.findRawDocument(id);
    this.assertOwner(service, actor);
    if (service.status === ServiceStatus.CANCELLED) return service;
    if (
      !CANCELLABLE_SERVICE_STATUSES.has(service.status) ||
      service.contractId ||
      service.selectedApplicationId
    ) {
      throw new ConflictException(
        'Ce service est engage et ne peut pas etre annule directement.',
      );
    }
    return this.updateStatus(id, ServiceStatus.CANCELLED);
  }

  async remove(id: string, actor: ServiceActor) {
    const service = await this.findRawDocument(id);
    this.assertOwner(service, actor);
    if (
      service.status !== ServiceStatus.DRAFT ||
      service.contractId ||
      service.selectedApplicationId
    ) {
      throw new ConflictException(
        'Seul un brouillon non engage peut etre supprime.',
      );
    }

    const deleted = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Service introuvable.');
    return { deleted: true, id };
  }

  private buildListFilter(
    query: ListServicesQueryDto,
    actor: AuthenticatedUser,
  ): ServiceFilter {
    const clauses: ServiceFilter[] = [
      {
        $or: [
          { ownerId: actor.sub },
          { status: { $in: PUBLIC_SERVICE_STATUSES } },
        ],
      },
    ];
    if (query.type) clauses.push({ type: query.type });
    if (query.category) clauses.push({ category: query.category });
    if (query.status) clauses.push({ status: query.status });
    if (query.ownerId) {
      clauses.push({
        ownerId: query.ownerId === 'me' ? actor.sub : query.ownerId,
      });
    }
    if (query.search?.trim()) {
      const pattern = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      clauses.push({
        $or: [
          { title: pattern },
          { description: pattern },
          { category: pattern },
        ],
      });
    }
    return clauses.length === 1 ? clauses[0] : { $and: clauses };
  }

  private async loadEnrichmentContext(
    rows: ServiceRow[],
    viewerId: string,
  ): Promise<EnrichmentContext> {
    const serviceIds = rows.map((row) => String(row._id));
    const ownerIds = rows.map((row) => row.ownerId);
    const neighborhoodIds = [...new Set(rows.map((row) => row.neighborhoodId))];
    const objectNeighborhoodIds = neighborhoodIds.filter((id) =>
      Types.ObjectId.isValid(id),
    );

    const [
      owners,
      neighborhoods,
      applicationCounts,
      proofCounts,
      applications,
      contracts,
      disputes,
    ] = await Promise.all([
      this.publicUsersService.findByIds(ownerIds),
      this.neighborhoodModel
        .find({
          $or: [
            { slug: { $in: neighborhoodIds } },
            { _id: { $in: objectNeighborhoodIds } },
          ],
        })
        .select('_id slug name city')
        .lean<NeighborhoodRow[]>()
        .exec(),
      this.applicationModel
        .aggregate<ApplicationCountRow>([
          {
            $match: {
              serviceId: { $in: serviceIds },
              status: { $ne: ServiceApplicationStatus.WITHDRAWN },
            },
          },
          { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        ])
        .exec(),
      this.proofModel
        .aggregate<ProofCountRow>([
          { $match: { serviceId: { $in: serviceIds } } },
          { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        ])
        .exec(),
      this.applicationModel
        .find({ serviceId: { $in: serviceIds }, applicantId: viewerId })
        .sort({ createdAt: -1 })
        .lean<ViewerApplicationRow[]>()
        .exec(),
      this.contractModel
        .find({
          serviceId: { $in: serviceIds },
          $or: [{ requesterId: viewerId }, { providerId: viewerId }],
        })
        .lean<ContractRow[]>()
        .exec(),
      this.disputeModel
        .find({
          serviceId: { $in: serviceIds },
          status: { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
        })
        .lean<DisputeRow[]>()
        .exec(),
    ]);

    const neighborhoodMap = new Map<string, NeighborhoodSummary>();
    for (const neighborhood of neighborhoods) {
      const summary = {
        id: String(neighborhood._id),
        name: neighborhood.name,
        city: neighborhood.city,
      };
      neighborhoodMap.set(String(neighborhood._id), summary);
      neighborhoodMap.set(neighborhood.slug, summary);
    }

    const viewerApplications = new Map<string, ViewerApplicationRow>();
    for (const application of applications) {
      if (!viewerApplications.has(application.serviceId)) {
        viewerApplications.set(application.serviceId, application);
      }
    }

    return {
      owners,
      neighborhoods: neighborhoodMap,
      applicationCounts: new Map(
        applicationCounts.map((entry) => [entry._id, entry.count]),
      ),
      proofCounts: new Map(
        proofCounts.map((entry) => [entry._id, entry.count]),
      ),
      viewerApplications,
      viewerContracts: new Map(
        contracts.map((contract) => [contract.serviceId, contract]),
      ),
      activeDisputes: new Map(
        disputes.map((dispute) => [dispute.serviceId, dispute]),
      ),
    };
  }

  private presentService(
    row: ServiceRow,
    actor: AuthenticatedUser,
    context: EnrichmentContext,
  ): ServiceResponse {
    const id = String(row._id);
    const application = context.viewerApplications.get(id);
    const contract = context.viewerContracts.get(id);
    const dispute = context.activeDisputes.get(id);
    const isOwner = row.ownerId === actor.sub;
    const isRequester = contract?.requesterId === actor.sub;
    const isProvider = contract?.providerId === actor.sub;
    const isParticipant = Boolean(isRequester || isProvider);
    const contractIsActive = contract?.status === ContractStatus.ACTIVE;
    const canModerate = [Role.MODERATOR, Role.ADMIN].includes(actor.role);
    const hasActiveDispute = Boolean(dispute);
    const canOpenDispute =
      isParticipant &&
      contractIsActive &&
      row.isPaid &&
      (contract?.pricePoints ?? 0) > 0 &&
      !hasActiveDispute &&
      [
        ServiceStatus.SCHEDULED,
        ServiceStatus.IN_PROGRESS,
        ServiceStatus.AWAITING_VALIDATION,
        ServiceStatus.CORRECTION_REQUESTED,
      ].includes(row.status);
    const canViewProofs = isParticipant;
    const canAddProof =
      isParticipant &&
      contractIsActive &&
      [
        ServiceStatus.IN_PROGRESS,
        ServiceStatus.AWAITING_VALIDATION,
        ServiceStatus.CORRECTION_REQUESTED,
      ].includes(row.status);
    const hasApplied = Boolean(application);
    const acceptsApplications = PUBLIC_SERVICE_STATUSES.includes(row.status);
    const canApply = !isOwner && acceptsApplications && !hasApplied;
    const canViewContract = Boolean(row.contractId && (isOwner || contract));
    const canCancel =
      isOwner &&
      CANCELLABLE_SERVICE_STATUSES.has(row.status) &&
      !row.contractId &&
      !row.selectedApplicationId;
    const canViewSelectedApplication =
      isOwner ||
      (application?.status === ServiceApplicationStatus.ACCEPTED &&
        String(application._id) === row.selectedApplicationId);

    return {
      id,
      title: row.title,
      description: row.description,
      type: row.type,
      category: row.category,
      availability: row.availability,
      neighborhoodId: row.neighborhoodId,
      ownerId: row.ownerId,
      isPaid: row.isPaid,
      pricePoints: row.pricePoints,
      status: row.status,
      executionStatus: row.status,
      scheduledAt: row.scheduledAt,
      startedAt: row.startedAt,
      markedDoneAt: row.markedDoneAt,
      validatedAt: row.validatedAt,
      correctionRequestedAt: row.correctionRequestedAt,
      correctionReason: isParticipant ? row.correctionReason : null,
      completedAt: row.completedAt,
      selectedApplicationId: canViewSelectedApplication
        ? row.selectedApplicationId
        : null,
      contractId: canViewContract ? row.contractId : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      neighborhood: context.neighborhoods.get(row.neighborhoodId) ?? null,
      owner: context.owners.get(row.ownerId) ?? null,
      applicationsCount: context.applicationCounts.get(id) ?? 0,
      proofsCount: canViewProofs ? (context.proofCounts.get(id) ?? 0) : 0,
      nextAction: this.getExecutionNextAction(
        row.status,
        Boolean(isRequester),
        Boolean(isProvider),
      ),
      viewer: {
        isOwner,
        hasApplied,
        applicationId: application ? String(application._id) : null,
        applicationStatus: application?.status ?? null,
        canApply,
        canManage: isOwner,
      },
      permissions: {
        canEdit:
          isOwner &&
          EDITABLE_SERVICE_STATUSES.has(row.status) &&
          !row.contractId &&
          !row.selectedApplicationId,
        canPublish: isOwner && row.status === ServiceStatus.DRAFT,
        canCancel,
        canApply,
        canViewApplications: isOwner,
        canGenerateContract:
          isOwner &&
          row.isPaid &&
          Boolean(row.selectedApplicationId) &&
          !row.contractId,
        canViewContract,
        canStart:
          Boolean(isProvider && contractIsActive) &&
          [ServiceStatus.CONTRACT_ACTIVE, ServiceStatus.SCHEDULED].includes(
            row.status,
          ),
        canAddProof,
        canMarkDone:
          Boolean(isProvider && contractIsActive) &&
          [
            ServiceStatus.IN_PROGRESS,
            ServiceStatus.CORRECTION_REQUESTED,
          ].includes(row.status),
        canValidate:
          Boolean(isRequester && contractIsActive) &&
          row.status === ServiceStatus.AWAITING_VALIDATION,
        canRequestCorrection:
          Boolean(isRequester && contractIsActive) &&
          row.status === ServiceStatus.AWAITING_VALIDATION,
        canViewProofs,
        canOpenDispute,
        canViewDispute: isParticipant && hasActiveDispute,
        canAddDisputeEvidence: isParticipant && hasActiveDispute,
        canAssignDispute: canModerate && hasActiveDispute,
        canStartReview: canModerate && hasActiveDispute,
        canResolveDispute: canModerate && hasActiveDispute,
        canCloseDispute: false,
      },
      activeDispute:
        isParticipant && dispute
          ? {
              id: String(dispute._id),
              status: dispute.status,
              reservedPoints: dispute.reservedPoints,
            }
          : null,
      contractSummary:
        canViewContract && contract
          ? {
              id: String(contract._id),
              status: contract.status,
              pricePoints: contract.pricePoints,
              signaturesCount: contract.signedByIds.length,
              requiredSignaturesCount: 2,
            }
          : null,
    };
  }

  private getNextInvolvementAction(
    viewerId: string,
    application?: ViewerApplicationRow,
    contract?: ContractRow,
    serviceStatus?: ServiceStatus,
  ) {
    if (
      contract?.status === ContractStatus.SENT &&
      !contract.signedByIds.includes(viewerId)
    ) {
      return 'sign_contract';
    }
    if (contract?.status === ContractStatus.ACTIVE) {
      return this.getExecutionNextAction(
        serviceStatus ?? ServiceStatus.CONTRACT_ACTIVE,
        contract.requesterId === viewerId,
        contract.providerId === viewerId,
      );
    }
    if (application?.status === ServiceApplicationStatus.ACCEPTED) {
      return 'wait_for_contract';
    }
    if (
      application &&
      [
        ServiceApplicationStatus.SUBMITTED,
        ServiceApplicationStatus.VIEWED,
      ].includes(application.status)
    ) {
      return 'wait_for_owner';
    }
    return null;
  }

  private getExecutionNextAction(
    status: ServiceStatus,
    isRequester: boolean,
    isProvider: boolean,
  ) {
    if (status === ServiceStatus.DISPUTED) return 'view_dispute';

    if (
      isProvider &&
      [ServiceStatus.CONTRACT_ACTIVE, ServiceStatus.SCHEDULED].includes(status)
    ) {
      return 'start_service';
    }
    if (
      isProvider &&
      [ServiceStatus.IN_PROGRESS, ServiceStatus.CORRECTION_REQUESTED].includes(
        status,
      )
    ) {
      return status === ServiceStatus.CORRECTION_REQUESTED
        ? 'address_correction'
        : 'mark_service_done';
    }
    if (isRequester && status === ServiceStatus.AWAITING_VALIDATION) {
      return 'validate_service';
    }
    if (status === ServiceStatus.COMPLETED) return 'service_completed';
    return 'follow_execution';
  }

  private async findRawRow(id: string): Promise<ServiceRow> {
    this.assertValidId(id);
    const service = await this.serviceModel
      .findById(id)
      .lean<ServiceRow | null>()
      .exec();
    if (!service) throw new NotFoundException('Service introuvable.');
    return service;
  }

  private async findRawDocument(id: string): Promise<ServiceDocument> {
    this.assertValidId(id);
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service introuvable.');
    return service;
  }

  private async updateStatus(id: string, status: ServiceStatus) {
    const updated = await this.serviceModel
      .findByIdAndUpdate(
        id,
        { status },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!updated) throw new NotFoundException('Service introuvable.');
    return updated;
  }

  private assertOwner(service: Pick<Service, 'ownerId'>, actor: ServiceActor) {
    if (service.ownerId !== actor.sub) {
      throw new ForbiddenException(
        'Seul le proprietaire du service peut effectuer cette action.',
      );
    }
  }

  private async assertNeighborhoodCanBeUsed(neighborhoodId: string) {
    const neighborhood = await this.neighborhoodModel
      .findOne(this.neighborhoodIdentifierFilter(neighborhoodId))
      .exec();
    if (!neighborhood) {
      throw new BadRequestException('Le quartier indique est introuvable.');
    }
    if (
      neighborhood.status === NeighborhoodStatus.ARCHIVED ||
      neighborhood.isActive === false
    ) {
      throw new BadRequestException(
        'Un quartier archive ne peut plus etre utilise.',
      );
    }
  }

  private neighborhoodIdentifierFilter(neighborhoodId: string) {
    const filters: Array<Record<string, unknown>> = [{ slug: neighborhoodId }];
    if (Types.ObjectId.isValid(neighborhoodId)) {
      filters.push({ _id: neighborhoodId });
    }
    return { $or: filters };
  }

  private assertValidId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Service introuvable.');
    }
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
