import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import {
  Neighborhood,
  NeighborhoodDocument,
} from './schemas/neighborhood.schema';

@Injectable()
export class NeighborhoodsService {
  constructor(
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
  ) {}

  async create(dto: CreateNeighborhoodDto, createdById: string) {
    return this.neighborhoodModel.create({
      ...dto,
      createdById,
      isActive: true,
    });
  }

  async findAll() {
    return this.neighborhoodModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string) {
    const neighborhood = await this.neighborhoodModel.findById(id).exec();

    if (!neighborhood) {
      throw new NotFoundException(`Quartier ${id} introuvable`);
    }

    return neighborhood;
  }

  async update(id: string, dto: UpdateNeighborhoodDto) {
    const neighborhood = await this.neighborhoodModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();

    if (!neighborhood) {
      throw new NotFoundException(`Quartier ${id} introuvable`);
    }

    return neighborhood;
  }

  async archive(id: string) {
    const neighborhood = await this.neighborhoodModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!neighborhood) {
      throw new NotFoundException(`Quartier ${id} introuvable`);
    }

    return {
      archived: true,
      id,
    };
  }
}
