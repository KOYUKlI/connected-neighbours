import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
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

type AlertActor = Pick<AuthenticatedUser, 'sub' | 'role'>;

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
  ) {}

  async create(incidentId: string, dto: CreateAlertDto, currentUser: AlertActor) {
    const incident = await this.assertIncidentExists(incidentId);
    this.assertCanCreateForIncident(incident, currentUser);

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

  async update(id: string, dto: UpdateAlertDto, currentUser: AlertActor) {
    this.assertModeratorOrAdmin(currentUser);

    const alert = await this.alertModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true })
      .exec();

    if (!alert) {
      throw new NotFoundException(`Alerte ${id} introuvable`);
    }

    return alert;
  }

  async resolve(id: string, currentUser: AlertActor) {
    this.assertModeratorOrAdmin(currentUser);

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

    return incident;
  }

  private assertCanCreateForIncident(
    incident: Pick<Incident, 'reportedById'>,
    currentUser: AlertActor,
  ) {
    if (
      this.canModerate(currentUser) ||
      incident.reportedById === currentUser.sub
    ) {
      return;
    }

    throw new ForbiddenException(
      'Seul le reporter ou un moderateur peut creer une alerte',
    );
  }

  private assertModeratorOrAdmin(currentUser: AlertActor) {
    if (this.canModerate(currentUser)) {
      return;
    }

    throw new ForbiddenException('Action reservee aux moderateurs');
  }

  private canModerate(currentUser: AlertActor) {
    return [Role.ADMIN, Role.MODERATOR].includes(currentUser.role);
  }
}
