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
    const service = await this.serviceModel.findById(serviceId).exec();

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} introuvable`);
    }

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
    return this.contractModel
      .find({
        $or: [{ requesterId: userId }, { providerId: userId }],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string) {
    const contract = await this.contractModel.findById(id).exec();

    if (!contract) {
      throw new NotFoundException(`Contrat ${id} introuvable`);
    }

    this.assertContractParty(contract, userId);

    return contract;
  }

  async sign(id: string, userId: string) {
    const contract = await this.contractModel.findById(id).exec();

    if (!contract) {
      throw new NotFoundException(`Contrat ${id} introuvable`);
    }

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
        ServiceStatus.CONTRACT_ACTIVE,
      );
    }

    return contract.save();
  }

  async complete(id: string, userId: string) {
    const contract = await this.contractModel.findById(id).exec();

    if (!contract) {
      throw new NotFoundException(`Contrat ${id} introuvable`);
    }

    this.assertContractParty(contract, userId);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException(
        'Seul un contrat en cours peut être terminé',
      );
    }

    if (contract.pricePoints > 0) {
      await this.pointsService.transferReservedPoints(
        contract.payerId,
        contract.receiverId,
        contract.pricePoints,
        contract.id,
        contract.serviceId,
      );
    }

    contract.status = ContractStatus.COMPLETED;
    contract.completedAt = new Date();

    await this.updateServiceStatus(contract.serviceId, ServiceStatus.COMPLETED);

    return contract.save();
  }

  async cancel(id: string, userId: string) {
    const contract = await this.contractModel.findById(id).exec();

    if (!contract) {
      throw new NotFoundException(`Contrat ${id} introuvable`);
    }

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
    const service = await this.serviceModel.findById(serviceId).exec();

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} introuvable`);
    }

    return service;
  }

  private async findApplication(applicationId: string) {
    const application = await this.applicationModel
      .findById(applicationId)
      .exec();

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
      throw new ForbiddenException('Accès interdit à ce contrat');
    }
  }

  private async updateServiceStatus(serviceId: string, status: ServiceStatus) {
    const service = await this.serviceModel
      .findByIdAndUpdate(serviceId, { status }, { returnDocument: 'after' })
      .exec();

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} introuvable`);
    }

    return service;
  }
}
