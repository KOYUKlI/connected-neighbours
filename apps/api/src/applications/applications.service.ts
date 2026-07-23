import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { GraphSyncService } from '../graph/graph-sync.service';
import { GraphEntityType } from '../graph/graph.types';

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
import { PublicUsersService } from '../users/public-users.service';

type ApplicationRow = ServiceApplication & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
type ServiceRow = Service & { _id: unknown; createdAt?: Date };

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
    private readonly publicUsersService: PublicUsersService,
    @Optional() private readonly graphSyncService?: GraphSyncService,
  ) {}

  async create(
    serviceId: string,
    applicantId: string,
    dto: CreateApplicationDto,
  ) {
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
      void this.graphSyncService?.enqueue(GraphEntityType.SERVICE, serviceId);
    }

    return application;
  }

  async findForService(serviceId: string, userId: string) {
    const service = await this.findService(serviceId);
    this.assertServiceOwner(service, userId);

    const applications = await this.applicationModel
      .find({ serviceId })
      .sort({ createdAt: -1 })
      .lean<ApplicationRow[]>()
      .exec();
    return this.presentApplications(applications);
  }

  async findMine(applicantId: string) {
    const applications = await this.applicationModel
      .find({ applicantId })
      .sort({ createdAt: -1 })
      .lean<ApplicationRow[]>()
      .exec();
    return this.presentApplications(applications);
  }

  private async presentApplications(applications: ApplicationRow[]) {
    if (applications.length === 0) return [];

    const serviceIds = [...new Set(applications.map((item) => item.serviceId))];
    const services = await this.serviceModel
      .find({ _id: { $in: serviceIds } })
      .select(
        '_id title type category status neighborhoodId ownerId isPaid pricePoints',
      )
      .lean<ServiceRow[]>()
      .exec();
    const serviceById = new Map(
      services.map((service) => [String(service._id), service]),
    );
    const publicUsers = await this.publicUsersService.findByIds([
      ...applications.map((item) => item.applicantId),
      ...applications.map((item) => item.ownerId),
    ]);

    return applications.map((application) => {
      const service = serviceById.get(application.serviceId);
      return {
        id: String(application._id),
        serviceId: application.serviceId,
        applicantId: application.applicantId,
        ownerId: application.ownerId,
        message: application.message,
        proposedDate: application.proposedDate,
        proposedPricePoints: application.proposedPricePoints,
        status: application.status,
        acceptedAt: application.acceptedAt,
        rejectedAt: application.rejectedAt,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        applicant: publicUsers.get(application.applicantId) ?? null,
        owner: publicUsers.get(application.ownerId) ?? null,
        service: service
          ? {
              id: String(service._id),
              title: service.title,
              type: service.type,
              category: service.category,
              status: service.status,
              neighborhoodId: service.neighborhoodId,
              isPaid: service.isPaid,
              pricePoints: service.pricePoints,
            }
          : null,
      };
    });
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
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    void this.graphSyncService?.enqueue(
      GraphEntityType.SERVICE,
      application.serviceId,
    );

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
    const service = await this.execOrNotFound(
      () => this.serviceModel.findById(serviceId).exec(),
      'Service introuvable.',
    );

    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }

    return service;
  }

  private async findApplication(id: string) {
    const application = await this.execOrNotFound(
      () => this.applicationModel.findById(id).exec(),
      'Candidature introuvable.',
    );

    if (!application) {
      throw new NotFoundException('Candidature introuvable.');
    }

    return application;
  }

  private async execOrNotFound<T>(
    operation: () => Promise<T>,
    message: string,
  ) {
    try {
      return await operation();
    } catch (error) {
      if (this.isMongooseCastError(error)) {
        throw new NotFoundException(message);
      }
      throw error;
    }
  }

  private isMongooseCastError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'CastError'
    );
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
