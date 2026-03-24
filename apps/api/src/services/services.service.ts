import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, ServiceDocument } from './schemas/service.schema';

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
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Service ${id} introuvable`);
    }

    return updated;
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
}
