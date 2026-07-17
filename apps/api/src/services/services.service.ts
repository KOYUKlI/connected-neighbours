import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import {
  Neighborhood,
  NeighborhoodDocument,
  NeighborhoodStatus,
} from '../neighborhoods/schemas/neighborhood.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, ServiceDocument, ServiceStatus } from './schemas/service.schema';

const SERVICE_UNPUBLISHABLE_STATUSES = new Set<ServiceStatus>([
  ServiceStatus.COMPLETED,
  ServiceStatus.CANCELLED,
  ServiceStatus.DISPUTED,
]);

type ServiceActor = Pick<AuthenticatedUser, 'sub' | 'role'>;

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
  ) {}

  async create(createServiceDto: CreateServiceDto, ownerId: string) {
    await this.assertNeighborhoodCanBeUsed(createServiceDto.neighborhoodId);

    return this.serviceModel.create({
      ...createServiceDto,
      ownerId,
      status: createServiceDto.status ?? 'published',
      pricePoints: createServiceDto.isPaid
        ? (createServiceDto.pricePoints ?? 0)
        : null,
    });
  }

  async findAll() {
    return this.serviceModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const service = await this.serviceModel.findById(id).exec();

    if (!service) {
      throw new NotFoundException(`Service ${id} introuvable`);
    }

    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    actor: ServiceActor,
  ) {
    const service = await this.findOne(id);
    this.assertCanManage(service, actor);

    const payload = { ...updateServiceDto };

    if (payload.neighborhoodId) {
      await this.assertNeighborhoodCanBeUsed(payload.neighborhoodId);
    }

    if (payload.isPaid === false) {
      payload.pricePoints = null;
    }

    const updated = await this.serviceModel
      .findByIdAndUpdate(id, payload, { returnDocument: 'after', runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Service ${id} introuvable`);
    }

    return updated;
  }

  async publish(id: string, actor: ServiceActor) {
    const service = await this.findOne(id);
    this.assertCanManage(service, actor);

    if (SERVICE_UNPUBLISHABLE_STATUSES.has(service.status)) {
      throw new BadRequestException('Ce service ne peut pas etre publie');
    }

    if (service.status === ServiceStatus.PUBLISHED) {
      return service;
    }

    return this.updateStatus(id, ServiceStatus.PUBLISHED);
  }

  async cancel(id: string, actor: ServiceActor) {
    const service = await this.findOne(id);
    this.assertCanManage(service, actor);

    if (service.status === ServiceStatus.COMPLETED) {
      throw new BadRequestException('Un service termine ne peut pas etre annule');
    }

    if (service.status === ServiceStatus.CANCELLED) {
      return service;
    }

    return this.updateStatus(id, ServiceStatus.CANCELLED);
  }

  async remove(id: string, actor: ServiceActor) {
    const service = await this.findOne(id);
    this.assertCanManage(service, actor);

    const deleted = await this.serviceModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Service ${id} introuvable`);
    }

    return {
      deleted: true,
      id,
    };
  }

  private async updateStatus(id: string, status: ServiceStatus) {
    const updated = await this.serviceModel
      .findByIdAndUpdate(
        id,
        { status },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Service ${id} introuvable`);
    }

    return updated;
  }

  private assertCanManage(
    service: Pick<Service, 'ownerId'>,
    actor: ServiceActor,
  ) {
    if (actor.role === Role.ADMIN || service.ownerId === actor.sub) {
      return;
    }

    throw new ForbiddenException('Seul le proprietaire du service peut agir');
  }

  private async assertNeighborhoodCanBeUsed(neighborhoodId: string) {
    const neighborhood = await this.neighborhoodModel
      .findOne(this.neighborhoodIdentifierFilter(neighborhoodId))
      .exec();

    if (!neighborhood) {
      throw new BadRequestException('Le quartier indique est introuvable');
    }

    if (
      neighborhood.status === NeighborhoodStatus.ARCHIVED ||
      neighborhood.isActive === false
    ) {
      throw new BadRequestException('Un quartier archive ne peut plus etre utilise');
    }
  }

  private neighborhoodIdentifierFilter(neighborhoodId: string) {
    const filters: Array<Record<string, unknown>> = [{ slug: neighborhoodId }];

    if (Types.ObjectId.isValid(neighborhoodId)) {
      filters.push({ _id: neighborhoodId });
    }

    return { $or: filters };
  }
}
