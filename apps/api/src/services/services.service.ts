import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, ServiceDocument, ServiceStatus } from './schemas/service.schema';

const SERVICE_UNPUBLISHABLE_STATUSES = new Set<ServiceStatus>([
  ServiceStatus.COMPLETED,
  ServiceStatus.CANCELLED,
  ServiceStatus.DISPUTED,
]);

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(createServiceDto: CreateServiceDto, ownerId: string) {
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

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const payload = { ...updateServiceDto };

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

  async publish(id: string) {
    const service = await this.findOne(id);

    if (SERVICE_UNPUBLISHABLE_STATUSES.has(service.status)) {
      throw new BadRequestException('Ce service ne peut pas etre publie');
    }

    if (service.status === ServiceStatus.PUBLISHED) {
      return service;
    }

    return this.updateStatus(id, ServiceStatus.PUBLISHED);
  }

  async cancel(id: string) {
    const service = await this.findOne(id);

    if (service.status === ServiceStatus.COMPLETED) {
      throw new BadRequestException('Un service termine ne peut pas etre annule');
    }

    if (service.status === ServiceStatus.CANCELLED) {
      return service;
    }

    return this.updateStatus(id, ServiceStatus.CANCELLED);
  }

  async remove(id: string) {
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
}
