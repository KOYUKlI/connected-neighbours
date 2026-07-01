import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import {
  Incident,
  IncidentDocument,
  IncidentSource,
  IncidentStatus,
} from './schemas/incident.schema';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
  ) {}

  async create(dto: CreateIncidentDto, currentUserId?: string) {
    const source = dto.source ?? IncidentSource.WEB;

    return this.incidentModel.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: dto.status ?? IncidentStatus.REPORTED,
      severity: dto.severity,
      neighborhoodId: dto.neighborhoodId,
      reportedById: dto.reportedById ?? currentUserId ?? null,
      source,
      externalId: dto.externalId ?? null,
      lastSyncedAt: dto.lastSyncedAt ?? null,
    });
  }

  async findAll() {
    return this.incidentModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const incident = await this.incidentModel.findById(id).exec();

    if (!incident) {
      throw new NotFoundException(`Incident ${id} introuvable`);
    }

    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto) {
    const incident = await this.incidentModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true })
      .exec();

    if (!incident) {
      throw new NotFoundException(`Incident ${id} introuvable`);
    }

    return incident;
  }

  async resolve(id: string) {
    const incident = await this.incidentModel
      .findByIdAndUpdate(
        id,
        { status: IncidentStatus.RESOLVED },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!incident) {
      throw new NotFoundException(`Incident ${id} introuvable`);
    }

    return incident;
  }

  async close(id: string) {
    const incident = await this.findOne(id);

    if (incident.status === IncidentStatus.REJECTED) {
      throw new BadRequestException('Un incident rejete ne peut pas etre ferme');
    }

    incident.status = IncidentStatus.CLOSED;

    return incident.save();
  }
}
