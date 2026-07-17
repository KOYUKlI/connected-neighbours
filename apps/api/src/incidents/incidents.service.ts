import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import {
  Incident,
  IncidentDocument,
  IncidentSource,
  IncidentStatus,
} from './schemas/incident.schema';

type IncidentActor = Pick<AuthenticatedUser, 'sub' | 'role'>;

const REPORTER_EDITABLE_STATUSES = new Set<IncidentStatus>([
  IncidentStatus.REPORTED,
  IncidentStatus.OPEN,
  IncidentStatus.IN_PROGRESS,
]);

const SENSITIVE_INCIDENT_UPDATE_FIELDS: Array<keyof UpdateIncidentDto> = [
  'status',
  'reportedById',
  'source',
  'externalId',
  'lastSyncedAt',
];

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateIncidentDto, currentUser?: IncidentActor) {
    const canModerate = currentUser ? this.canModerate(currentUser) : false;
    const source =
      canModerate || !currentUser
        ? (dto.source ?? IncidentSource.WEB)
        : IncidentSource.WEB;
    const status =
      canModerate || !currentUser
        ? (dto.status ?? IncidentStatus.REPORTED)
        : IncidentStatus.REPORTED;

    return this.incidentModel.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status,
      severity: dto.severity,
      neighborhoodId: dto.neighborhoodId,
      reportedById: this.resolveReporterId(dto, currentUser),
      source,
      externalId: dto.externalId ?? null,
      lastSyncedAt: dto.lastSyncedAt ?? null,
    });
  }

  async findAll() {
    const incidents = await this.incidentModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const reporterIds = Array.from(
      new Set(
        incidents
          .map((incident) => incident.reportedById)
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

    return incidents.map((incident) => ({
      ...incident,
      reporterName: incident.reportedById
        ? (reporterNameById.get(incident.reportedById) ?? null)
        : null,
    }));
  }

  async findOne(id: string) {
    const incident = await this.incidentModel.findById(id).exec();

    if (!incident) {
      throw new NotFoundException(`Incident ${id} introuvable`);
    }

    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto, currentUser: IncidentActor) {
    const incident = await this.findOne(id);
    const payload = this.buildUpdatePayload(incident, dto, currentUser);

    if (Object.keys(payload).length === 0) {
      return incident;
    }

    const updatedIncident = await this.incidentModel
      .findByIdAndUpdate(id, payload, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();

    if (!updatedIncident) {
      throw new NotFoundException(`Incident ${id} introuvable`);
    }

    return updatedIncident;
  }

  async resolve(id: string, currentUser: IncidentActor) {
    this.assertModeratorOrAdmin(currentUser);

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

  async close(id: string, currentUser: IncidentActor) {
    this.assertModeratorOrAdmin(currentUser);

    const incident = await this.findOne(id);

    if (incident.status === IncidentStatus.REJECTED) {
      throw new BadRequestException('Un incident rejete ne peut pas etre ferme');
    }

    incident.status = IncidentStatus.CLOSED;

    return incident.save();
  }

  private resolveReporterId(
    dto: Pick<CreateIncidentDto, 'reportedById'>,
    currentUser?: IncidentActor,
  ) {
    if (!currentUser) {
      return dto.reportedById ?? null;
    }

    if (this.canModerate(currentUser)) {
      return dto.reportedById ?? currentUser.sub;
    }

    return currentUser.sub;
  }

  private buildUpdatePayload(
    incident: IncidentDocument,
    dto: UpdateIncidentDto,
    currentUser: IncidentActor,
  ) {
    if (this.canModerate(currentUser)) {
      return dto;
    }

    if (incident.reportedById !== currentUser.sub) {
      throw new ForbiddenException(
        'Seul le reporter peut modifier cet incident',
      );
    }

    if (!REPORTER_EDITABLE_STATUSES.has(incident.status)) {
      throw new BadRequestException(
        'Cet incident ne peut plus etre modifie par son reporter',
      );
    }

    const hasSensitiveUpdate = SENSITIVE_INCIDENT_UPDATE_FIELDS.some(
      (field) => dto[field] !== undefined,
    );

    if (hasSensitiveUpdate) {
      throw new ForbiddenException(
        'Les changements sensibles sont reserves aux moderateurs',
      );
    }

    const { title, description, type, severity, neighborhoodId } = dto;

    return {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(severity !== undefined ? { severity } : {}),
      ...(neighborhoodId !== undefined ? { neighborhoodId } : {}),
    };
  }

  private assertModeratorOrAdmin(currentUser: IncidentActor) {
    if (this.canModerate(currentUser)) {
      return;
    }

    throw new ForbiddenException('Action reservee aux moderateurs');
  }

  private canModerate(currentUser: IncidentActor) {
    return [Role.ADMIN, Role.MODERATOR].includes(currentUser.role);
  }
}
