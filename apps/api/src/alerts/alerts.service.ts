import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../auth/schemas/user.schema';
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
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(incidentId: string, dto: CreateAlertDto, currentUserId?: string) {
    await this.assertIncidentExists(incidentId);

    return this.alertModel.create({
      incidentId,
      title: dto.title,
      details: dto.details,
      severity: dto.severity,
      status: dto.status ?? AlertStatus.CREATED,
      source: dto.source ?? AlertSource.WEB,
      externalId: dto.externalId ?? null,
      reportedById: currentUserId ?? null,
      resolvedAt: null,
    });
  }

  async findForIncident(incidentId: string) {
    await this.assertIncidentExists(incidentId);

    const alerts = await this.alertModel
      .find({ incidentId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const reporterIds = Array.from(
      new Set(
        alerts
          .map((alert) => alert.reportedById)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const reporters = reporterIds.length
      ? await this.userModel
          .find({ _id: { $in: reporterIds } })
          .select('displayName')
          .lean()
          .exec()
      : [];

    const reporterNameById = new Map(
      reporters.map((user) => [String(user._id), user.displayName]),
    );

    return alerts.map((alert) => ({
      ...alert,
      reporterName: alert.reportedById
        ? (reporterNameById.get(alert.reportedById) ?? null)
        : null,
    }));
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
      .findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true })
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
        { returnDocument: 'after', runValidators: true },
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
