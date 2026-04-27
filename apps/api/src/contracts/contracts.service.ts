import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { PointsService } from '../points/points.service';
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
    private readonly pointsService: PointsService,
  ) {}

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

    await this.pointsService.reserve({
      payerId: parties.payerId,
      serviceId,
      contractId,
      amount: service.pricePoints,
    });

    const contract = await this.contractModel.create({
      _id: contractId,
      serviceId,
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
      ServiceStatus.ACCEPTED,
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

    if (!contract.signedByIds.includes(userId)) {
      contract.signedByIds.push(userId);
    }

    const allPartiesSigned =
      contract.signedByIds.includes(contract.requesterId) &&
      contract.signedByIds.includes(contract.providerId);

    if (allPartiesSigned) {
      contract.status = ContractStatus.ACTIVE;
      contract.signedAt = new Date();

      await this.updateServiceStatus(
        contract.serviceId,
        ServiceStatus.IN_PROGRESS,
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

    await this.pointsService.transferReserved({
      payerId: contract.payerId,
      receiverId: contract.receiverId,
      serviceId: contract.serviceId,
      contractId: contract.id,
      amount: contract.pricePoints,
    });

    contract.status = ContractStatus.COMPLETED;
    contract.completedAt = new Date();

    await this.updateServiceStatus(contract.serviceId, ServiceStatus.COMPLETED);

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

  private assertContractParty(contract: ContractDocument, userId: string) {
    if (contract.requesterId !== userId && contract.providerId !== userId) {
      throw new ForbiddenException('Accès interdit à ce contrat');
    }
  }

  private async updateServiceStatus(serviceId: string, status: ServiceStatus) {
    const service = await this.serviceModel
      .findByIdAndUpdate(serviceId, { status }, { new: true })
      .exec();

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} introuvable`);
    }

    return service;
  }
}
