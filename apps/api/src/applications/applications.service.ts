import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Service,
  ServiceDocument,
  ServiceStatus,
} from '../services/schemas/service.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import {
  ActiveServiceApplicationStatuses,
  ServiceApplication,
  ServiceApplicationDocument,
  ServiceApplicationStatus,
} from './schemas/service-application.schema';

const APPLICATION_CREATABLE_SERVICE_STATUSES = new Set<ServiceStatus>([
  ServiceStatus.PUBLISHED,
  ServiceStatus.APPLICATION_RECEIVED,
]);

const ACTIONABLE_APPLICATION_STATUSES = new Set<ServiceApplicationStatus>([
  ServiceApplicationStatus.SUBMITTED,
  ServiceApplicationStatus.VIEWED,
]);

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(ServiceApplication.name)
    private readonly applicationModel: Model<ServiceApplicationDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(serviceId: string, applicantId: string, dto: CreateApplicationDto) {
    const service = await this.findService(serviceId);

    if (service.ownerId === applicantId) {
      throw new BadRequestException(
        'Un utilisateur ne peut pas candidater a son propre service',
      );
    }

    if (!APPLICATION_CREATABLE_SERVICE_STATUSES.has(service.status)) {
      throw new BadRequestException(
        'Ce service ne peut plus recevoir de candidatures',
      );
    }

    const existingApplication = await this.applicationModel
      .findOne({
        serviceId,
        applicantId,
        status: { $in: ActiveServiceApplicationStatuses },
      })
      .exec();

    if (existingApplication) {
      throw new BadRequestException(
        'Une candidature active existe deja pour ce service',
      );
    }

    const application = await this.applicationModel.create({
      serviceId,
      applicantId,
      ownerId: service.ownerId,
      message: dto.message,
      proposedDate: dto.proposedDate ?? null,
      proposedPricePoints: dto.proposedPricePoints ?? null,
      status: ServiceApplicationStatus.SUBMITTED,
      acceptedAt: null,
      rejectedAt: null,
    });

    if (service.status === ServiceStatus.PUBLISHED) {
      await this.serviceModel
        .findByIdAndUpdate(serviceId, {
          status: ServiceStatus.APPLICATION_RECEIVED,
        })
        .exec();
    }

    return application;
  }

  async findForService(serviceId: string, userId: string) {
    const service = await this.findService(serviceId);
    this.assertServiceOwner(service, userId);

    return this.applicationModel
      .find({ serviceId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findMine(applicantId: string) {
    return this.applicationModel
      .find({ applicantId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async accept(id: string, userId: string) {
    const application = await this.findApplication(id);
    const service = await this.findService(application.serviceId);

    this.assertServiceOwner(service, userId);

    if (application.status !== ServiceApplicationStatus.SUBMITTED) {
      throw new BadRequestException(
        'Seule une candidature soumise peut etre acceptee',
      );
    }

    if (service.selectedApplicationId) {
      throw new BadRequestException(
        'Une candidature est deja selectionnee pour ce service',
      );
    }

    const acceptedAt = new Date();
    application.status = ServiceApplicationStatus.ACCEPTED;
    application.acceptedAt = acceptedAt;
    await application.save();

    await this.applicationModel
      .updateMany(
        {
          serviceId: application.serviceId,
          _id: { $ne: application.id },
          status: {
            $in: [
              ServiceApplicationStatus.SUBMITTED,
              ServiceApplicationStatus.VIEWED,
            ],
          },
        },
        {
          status: ServiceApplicationStatus.REJECTED,
          rejectedAt: acceptedAt,
        },
      )
      .exec();

    await this.serviceModel
      .findByIdAndUpdate(
        application.serviceId,
        {
          selectedApplicationId: application.id,
          status: ServiceStatus.CANDIDATE_SELECTED,
        },
        { new: true, runValidators: true },
      )
      .exec();

    return application;
  }

  async reject(id: string, userId: string) {
    const application = await this.findApplication(id);
    const service = await this.findService(application.serviceId);

    this.assertServiceOwner(service, userId);

    if (!ACTIONABLE_APPLICATION_STATUSES.has(application.status)) {
      throw new BadRequestException(
        'Cette candidature ne peut plus etre rejetee',
      );
    }

    application.status = ServiceApplicationStatus.REJECTED;
    application.rejectedAt = new Date();

    return application.save();
  }

  async withdraw(id: string, userId: string) {
    const application = await this.findApplication(id);

    if (application.applicantId !== userId) {
      throw new ForbiddenException('Acces interdit a cette candidature');
    }

    if (!ACTIONABLE_APPLICATION_STATUSES.has(application.status)) {
      throw new BadRequestException(
        'Cette candidature ne peut plus etre retiree',
      );
    }

    application.status = ServiceApplicationStatus.WITHDRAWN;

    return application.save();
  }

  private async findService(serviceId: string) {
    const service = await this.serviceModel.findById(serviceId).exec();

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} introuvable`);
    }

    return service;
  }

  private async findApplication(id: string) {
    const application = await this.applicationModel.findById(id).exec();

    if (!application) {
      throw new NotFoundException(`Candidature ${id} introuvable`);
    }

    return application;
  }

  private assertServiceOwner(
    service: Pick<Service, 'ownerId'>,
    userId: string,
  ) {
    if (service.ownerId !== userId) {
      throw new ForbiddenException('Seul le proprietaire du service peut agir');
    }
  }
}
