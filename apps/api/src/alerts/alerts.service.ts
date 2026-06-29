import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Incident,
  IncidentDocument,
} from '../incidents/schemas/incident.schema';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import {
  Alert,
  AlertDocument,
  AlertSource,
  AlertStatus,
} from './schemas/alert.schema';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
  ) {}

  async create(incidentId: string, dto: CreateAlertDto) {
    await this.assertIncidentExists(incidentId);

    return this.alertModel.create({
      incidentId,
      title: dto.title,
      details: dto.details,
      severity: dto.severity,
      status: dto.status ?? AlertStatus.CREATED,
      source: dto.source ?? AlertSource.WEB,
      externalId: dto.externalId ?? null,
      resolvedAt: null,
    });
  }

  async findForIncident(incidentId: string) {
    await this.assertIncidentExists(incidentId);

    return this.alertModel
      .find({ incidentId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const alert = await this.alertModel.findById(id).exec();

    if (!alert) {
      throw new NotFoundException(`Alerte ${id} introuvable`);
    }

    return alert;
  }

  async update(id: string, dto: UpdateAlertDto) {
    const alert = await this.alertModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();

    if (!alert) {
      throw new NotFoundException(`Alerte ${id} introuvable`);
    }

    return alert;
  }

  async resolve(id: string) {
    const alert = await this.alertModel
      .findByIdAndUpdate(
        id,
        {
          status: AlertStatus.RESOLVED,
          resolvedAt: new Date(),
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!alert) {
      throw new NotFoundException(`Alerte ${id} introuvable`);
    }

    return alert;
  }

  private async assertIncidentExists(incidentId: string) {
    const incident = await this.incidentModel.findById(incidentId).exec();

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} introuvable`);
    }
  }
}
