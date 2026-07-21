import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { PointsService } from '../points/points.service';
import {
  ServiceApplication,
  ServiceApplicationDocument,
  ServiceApplicationStatus,
} from '../applications/schemas/service-application.schema';
import { ServiceExecutionService } from '../services/service-execution.service';
import {
  Service,
  ServiceDocument,
  ServiceStatus,
  ServiceType,
} from '../services/schemas/service.schema';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from './schemas/contract.schema';
import { PublicUsersService } from '../users/public-users.service';

type ContractRow = Contract & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
type ServiceRow = Service & { _id: unknown };

type ServiceParties = {
  requesterId: string;
  providerId: string;
  payerId: string;
  receiverId: string;
};

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(ServiceApplication.name)
    private readonly applicationModel: Model<ServiceApplicationDocument>,
    private readonly pointsService: PointsService,
    private readonly publicUsersService: PublicUsersService,
    private readonly executionService: ServiceExecutionService,
  ) {}

  async createFromApplication(
    applicationId: string,
    currentUser: AuthenticatedUser,
  ) {
    const application = await this.findApplication(applicationId);

    if (application.status !== ServiceApplicationStatus.ACCEPTED) {
      throw new BadRequestException(
        'Seule une candidature acceptee peut generer un contrat',
      );
    }

    const service = await this.findService(application.serviceId);

    if (service.ownerId !== currentUser.sub) {
      throw new ForbiddenException(
        'Seul le proprietaire du service peut generer le contrat',
      );
    }

    await this.assertNoExistingContract(service.id, application.id);

    const pricePoints = this.resolveApplicationContractPrice(
      service,
      application,
    );
    const contractId = new Types.ObjectId().toString();

    if (service.isPaid) {
      await this.pointsService.reservePoints(
        service.ownerId,
        pricePoints,
        contractId,
        service.id,
      );
    }

    const contract = await this.contractModel.create({
      _id: contractId,
      serviceId: service.id,
      applicationId: application.id,
      requesterId: service.ownerId,
      providerId: application.applicantId,
      payerId: service.ownerId,
      receiverId: application.applicantId,
      pricePoints,
      status: ContractStatus.SENT,
      signedByIds: [],
      signedAt: null,
      completedAt: null,
    });

    const updatedService = await this.serviceModel
      .findByIdAndUpdate(
        service.id,
        {
          contractId,
          status: ServiceStatus.AWAITING_SIGNATURES,
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!updatedService) {
      throw new NotFoundException(`Service ${service.id} introuvable`);
    }

    return {
      service: updatedService,
      contract,
    };
  }

  async acceptService(serviceId: string, actorId: string) {
    const service = await this.findService(serviceId);

    if (service.ownerId === actorId) {
      throw new BadRequestException(
        'Un utilisateur ne peut pas accepter son propre service',
      );
    }

    if (service.status !== ServiceStatus.PUBLISHED) {
      throw new BadRequestException('Ce service ne peut plus être accepté');
    }

    if (!service.isPaid) {
      const acceptedService = await this.updateServiceStatus(
        serviceId,
        ServiceStatus.ACCEPTED,
      );

      return {
        service: acceptedService,
        contract: null,
      };
    }

    if (!service.pricePoints || service.pricePoints <= 0) {
      throw new BadRequestException(
        'Un service payant doit avoir un prix en points positif',
      );
    }

    const parties = this.resolveParties(service, actorId);
    const contractId = new Types.ObjectId().toString();

    await this.pointsService.reservePoints(
      parties.payerId,
      service.pricePoints,
      contractId,
      serviceId,
    );

    const contract = await this.contractModel.create({
      _id: contractId,
      serviceId,
      applicationId: null,
      requesterId: parties.requesterId,
      providerId: parties.providerId,
      payerId: parties.payerId,
      receiverId: parties.receiverId,
      pricePoints: service.pricePoints,
      status: ContractStatus.SENT,
      signedByIds: [],
      signedAt: null,
      completedAt: null,
    });

    const acceptedService = await this.updateServiceStatus(
      serviceId,
      ServiceStatus.AWAITING_SIGNATURES,
    );

    return {
      service: acceptedService,
      contract,
    };
  }

  async findAllForUser(userId: string) {
    const contracts = await this.contractModel
      .find({
        $or: [{ requesterId: userId }, { providerId: userId }],
      })
      .sort({ createdAt: -1 })
      .lean<ContractRow[]>()
      .exec();
    return this.presentContracts(contracts);
  }

  async findOne(id: string, userId: string) {
    const contract = await this.findContract(id);

    this.assertContractParty(contract, userId);
    const [presented] = await this.presentContracts([
      contract.toObject() as ContractRow,
    ]);
    return presented;
  }

  private async presentContracts(contracts: ContractRow[]) {
    if (contracts.length === 0) return [];

    const serviceIds = [...new Set(contracts.map((item) => item.serviceId))];
    const [services, publicUsers] = await Promise.all([
      this.serviceModel
        .find({ _id: { $in: serviceIds } })
        .select('_id title type category status neighborhoodId')
        .lean<ServiceRow[]>()
        .exec(),
      this.publicUsersService.findByIds([
        ...contracts.map((item) => item.requesterId),
        ...contracts.map((item) => item.providerId),
      ]),
    ]);
    const serviceById = new Map(
      services.map((service) => [String(service._id), service]),
    );

    return contracts.map((contract) => {
      const service = serviceById.get(contract.serviceId);
      return {
        id: String(contract._id),
        serviceId: contract.serviceId,
        applicationId: contract.applicationId,
        requesterId: contract.requesterId,
        providerId: contract.providerId,
        payerId: contract.payerId,
        receiverId: contract.receiverId,
        pricePoints: contract.pricePoints,
        status: contract.status,
        signedByIds: contract.signedByIds,
        signedAt: contract.signedAt,
        completedAt: contract.completedAt,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        requester: publicUsers.get(contract.requesterId) ?? null,
        provider: publicUsers.get(contract.providerId) ?? null,
        service: service
          ? {
              id: String(service._id),
              title: service.title,
              type: service.type,
              category: service.category,
              status: service.status,
              neighborhoodId: service.neighborhoodId,
            }
          : null,
      };
    });
  }

  async sign(id: string, userId: string) {
    const contract = await this.findContract(id);

    this.assertContractParty(contract, userId);

    if (contract.status !== ContractStatus.SENT) {
      throw new BadRequestException('Ce contrat ne peut plus être signé');
    }

    if (contract.signedByIds.includes(userId)) {
      throw new BadRequestException(
        'Ce contrat est deja signe par cet utilisateur',
      );
    }

    contract.signedByIds.push(userId);

    const allPartiesSigned =
      contract.signedByIds.includes(contract.requesterId) &&
      contract.signedByIds.includes(contract.providerId);

    if (allPartiesSigned) {
      contract.status = ContractStatus.ACTIVE;
      contract.signedAt = new Date();

      await this.updateServiceStatus(
        contract.serviceId,
        ServiceStatus.SCHEDULED,
        { scheduledAt: contract.signedAt },
      );
    }

    return contract.save();
  }

  async complete(id: string, actor: AuthenticatedUser) {
    await this.executionService.validateByContract(id, actor);
    return this.findContract(id);
  }

  async cancel(id: string, userId: string) {
    const contract = await this.findContract(id);

    this.assertContractParty(contract, userId);

    if (contract.status === ContractStatus.COMPLETED) {
      throw new BadRequestException(
        'Un contrat termine ne peut pas etre annule',
      );
    }

    if (contract.status === ContractStatus.CANCELLED) {
      return contract;
    }

    if (contract.pricePoints > 0) {
      await this.pointsService.releaseReservedPoints(
        contract.payerId,
        contract.pricePoints,
        contract.id,
        contract.serviceId,
      );
    }

    contract.status = ContractStatus.CANCELLED;
    await this.updateServiceStatus(contract.serviceId, ServiceStatus.CANCELLED);

    return contract.save();
  }

  private resolveParties(
    service: Pick<Service, 'ownerId' | 'type'>,
    actorId: string,
  ): ServiceParties {
    if (service.type === ServiceType.OFFER) {
      return {
        requesterId: actorId,
        providerId: service.ownerId,
        payerId: actorId,
        receiverId: service.ownerId,
      };
    }

    return {
      requesterId: service.ownerId,
      providerId: actorId,
      payerId: service.ownerId,
      receiverId: actorId,
    };
  }

  private async findService(serviceId: string) {
    const service = await this.execOrNotFound(
      () => this.serviceModel.findById(serviceId).exec(),
      'Service introuvable.',
    );

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} introuvable`);
    }

    return service;
  }

  private async findApplication(applicationId: string) {
    const application = await this.execOrNotFound(
      () => this.applicationModel.findById(applicationId).exec(),
      'Candidature introuvable.',
    );

    if (!application) {
      throw new NotFoundException(`Candidature ${applicationId} introuvable`);
    }

    return application;
  }

  private async assertNoExistingContract(
    serviceId: string,
    applicationId: string,
  ) {
    const existingContract = await this.contractModel
      .findOne({
        $or: [{ serviceId }, { applicationId }],
        status: { $ne: ContractStatus.CANCELLED },
      })
      .exec();

    if (existingContract) {
      throw new BadRequestException(
        'Un contrat existe deja pour ce service ou cette candidature',
      );
    }
  }

  private resolveApplicationContractPrice(
    service: Pick<Service, 'isPaid' | 'pricePoints'>,
    application: Pick<ServiceApplication, 'proposedPricePoints'>,
  ) {
    if (!service.isPaid) {
      return 0;
    }

    const pricePoints = application.proposedPricePoints ?? service.pricePoints;

    if (!pricePoints || pricePoints <= 0) {
      throw new BadRequestException(
        'Un service payant doit avoir un prix en points positif',
      );
    }

    return pricePoints;
  }

  private assertContractParty(contract: ContractDocument, userId: string) {
    if (contract.requesterId !== userId && contract.providerId !== userId) {
      throw new ForbiddenException(
        "Ce contrat n'est pas accessible avec votre compte.",
      );
    }
  }

  private async updateServiceStatus(
    serviceId: string,
    status: ServiceStatus,
    extra: Record<string, unknown> = {},
  ) {
    const service = await this.serviceModel
      .findByIdAndUpdate(
        serviceId,
        { status, ...extra },
        { returnDocument: 'after' },
      )
      .exec();

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} introuvable`);
    }

    return service;
  }

  private async findContract(id: string) {
    const contract = await this.execOrNotFound(
      () => this.contractModel.findById(id).exec(),
      'Contrat introuvable.',
    );
    if (!contract) throw new NotFoundException('Contrat introuvable.');
    return contract;
  }

  private async execOrNotFound<T>(
    operation: () => Promise<T>,
    message: string,
  ) {
    try {
      return await operation();
    } catch (error) {
      const errorName = (error as { name?: unknown } | null)?.name;
      if (
        typeof error === 'object' &&
        error !== null &&
        errorName === 'CastError'
      ) {
        throw new NotFoundException(message);
      }
      throw error;
    }
  }
}
