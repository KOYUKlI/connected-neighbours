import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  NeighborhoodAssignmentSource,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import {
  NeighborhoodEvent,
  EventDocument,
} from '../events/schemas/event.schema';
import {
  Incident,
  IncidentDocument,
} from '../incidents/schemas/incident.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Vote, VoteDocument } from '../votes/schemas/vote.schema';
import { AdminListNeighborhoodsQueryDto } from './dto/admin-list-neighborhoods-query.dto';
import { AssignUserNeighborhoodDto } from './dto/assign-user-neighborhood.dto';
import { ContainsPointDto } from './dto/contains-point.dto';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { ResolveNeighborhoodDto } from './dto/resolve-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import {
  clonePolygon,
  pointInsidePolygon,
  polygonsOverlap,
  validateGeoJsonPoint,
  validatePoint,
  validatePolygon,
} from './neighborhood-geometry';
import {
  GeoJsonPolygon,
  Neighborhood,
  NeighborhoodAuditType,
  NeighborhoodDocument,
  NeighborhoodStatus,
} from './schemas/neighborhood.schema';

type NeighborhoodRow = Neighborhood & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
type CountRow = { _id: string; count: number };
type NeighborhoodStats = {
  users: number;
  services: number;
  incidents: number;
  events: number;
  votes: number;
};

const EMPTY_STATS: NeighborhoodStats = {
  users: 0,
  services: 0,
  incidents: 0,
  events: 0,
  votes: 0,
};
const PENDING_ASSIGNMENT_TTL_MS = 15 * 60 * 1000;

const DEMO_NEIGHBORHOODS: Array<
  CreateNeighborhoodDto & { status: NeighborhoodStatus }
> = [
  {
    name: 'Quartier Centre',
    slug: 'quartier-centre',
    description:
      'Le cœur du quartier, entre commerces et services de proximité.',
    city: 'Paris',
    postalCode: '75001',
    postalCodes: ['75001'],
    geometry: rectangle(2.3408, 48.8517, 2.3508, 48.8617),
    status: NeighborhoodStatus.ACTIVE,
  },
  {
    name: 'Quartier Nord',
    slug: 'quartier-nord',
    description: 'Un secteur résidentiel au nord du quartier de démonstration.',
    city: 'Paris',
    postalCode: '75002',
    postalCodes: ['75002'],
    geometry: rectangle(2.3408, 48.863, 2.3508, 48.873),
    status: NeighborhoodStatus.ACTIVE,
  },
  {
    name: 'Quartier Sud historique',
    slug: 'quartier-sud-historique',
    description: 'Ancien périmètre conservé pour les historiques.',
    city: 'Paris',
    postalCode: '75006',
    postalCodes: ['75006'],
    geometry: rectangle(2.3408, 48.84, 2.3508, 48.85),
    status: NeighborhoodStatus.ARCHIVED,
  },
];

@Injectable()
export class NeighborhoodsService implements OnModuleInit {
  constructor(
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(NeighborhoodEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
  ) {}

  async onModuleInit() {
    if (process.env.DEV_AUTH_SEED === 'true') {
      await this.ensureDemoNeighborhoods();
    }
  }

  async create(dto: CreateNeighborhoodDto, createdById: string) {
    const geometry = this.geometryFromInput(dto);
    const validation = validatePolygon(geometry);
    await this.assertNoActiveOverlap(geometry);
    const postalCodes = this.normalizePostalCodes(
      dto.postalCodes?.length ? dto.postalCodes : [dto.postalCode],
    );
    const now = new Date();
    try {
      return await this.neighborhoodModel.create({
        name: dto.name.trim(),
        slug: dto.slug.trim().toLowerCase(),
        description: dto.description.trim(),
        city: dto.city.trim(),
        postalCode: postalCodes[0],
        postalCodes,
        geometry: clonePolygon(geometry),
        boundary: clonePolygon(geometry),
        center: validation.center,
        createdById,
        status: NeighborhoodStatus.ACTIVE,
        isActive: true,
        archivedAt: null,
        history: [
          {
            type: NeighborhoodAuditType.CREATED,
            actorId: createdById,
            occurredAt: now,
            metadata: {
              vertices: validation.vertices,
              validation: 'polygon-basic-topology',
            },
          },
        ],
      });
    } catch (error) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException('Un quartier utilise déjà ce slug.');
      }
      throw error;
    }
  }

  async findAll() {
    const rows = await this.neighborhoodModel
      .find(this.activeFilter())
      .sort({ name: 1 })
      .lean<NeighborhoodRow[]>()
      .exec();
    return rows.map((row) => this.presentPublic(row));
  }

  async findPublicOne(id: string) {
    const row = await this.neighborhoodModel
      .findOne({ $and: [this.identifierFilter(id), this.activeFilter()] })
      .lean<NeighborhoodRow | null>()
      .exec();
    if (!row) throw new NotFoundException('Quartier introuvable.');
    return this.presentPublic(row);
  }

  async findMine(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select(
        'neighborhoodId neighborhoodAssignedAt neighborhoodAssignmentSource',
      )
      .lean<{
        neighborhoodId?: string;
        neighborhoodAssignedAt?: Date | null;
        neighborhoodAssignmentSource?: NeighborhoodAssignmentSource;
      } | null>()
      .exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (!user.neighborhoodId) {
      return { assigned: false, neighborhood: null, assignment: null };
    }
    const row = await this.findByIdentifierRow(user.neighborhoodId);
    return {
      assigned: Boolean(row),
      neighborhood: row ? this.presentPublic(row) : null,
      assignment: row
        ? {
            assignedAt: user.neighborhoodAssignedAt ?? null,
            source: user.neighborhoodAssignmentSource ?? null,
            exactPositionStored: false,
          }
        : null,
    };
  }

  async resolve(dto: ResolveNeighborhoodDto, userId: string) {
    const point = validateGeoJsonPoint(dto);
    const rows = await this.neighborhoodModel
      .find(this.activeFilter())
      .select(
        '_id name slug description city postalCode postalCodes status isActive geometry boundary center',
      )
      .lean<NeighborhoodRow[]>()
      .exec();
    const matches = rows.filter((row) => {
      const geometry = this.geometryFromRow(row);
      return geometry ? pointInsidePolygon(point.coordinates, geometry) : false;
    });
    if (matches.length > 1) {
      throw new ConflictException(
        'Plusieurs quartiers actifs couvrent ce point. Contactez l’administration.',
      );
    }
    if (matches.length === 0) {
      await this.userModel
        .updateOne(
          { _id: userId },
          {
            $unset: {
              pendingNeighborhoodId: 1,
              pendingNeighborhoodExpiresAt: 1,
            },
          },
        )
        .exec();
      return { status: 'not_found', neighborhood: null };
    }
    const neighborhood = matches[0];
    const expiresAt = new Date(Date.now() + PENDING_ASSIGNMENT_TTL_MS);
    const updated = await this.userModel
      .updateOne(
        { _id: userId, isActive: true },
        {
          $set: {
            pendingNeighborhoodId: neighborhood.slug,
            pendingNeighborhoodExpiresAt: expiresAt,
          },
        },
      )
      .exec();
    if (updated.matchedCount !== 1) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return {
      status: 'found',
      neighborhood: this.presentPublic(neighborhood),
      confirmationExpiresAt: expiresAt,
    };
  }

  async confirmResolvedNeighborhood(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select(
        '+pendingNeighborhoodId +pendingNeighborhoodExpiresAt neighborhoodId isActive',
      )
      .lean<{
        neighborhoodId: string;
        pendingNeighborhoodId?: string | null;
        pendingNeighborhoodExpiresAt?: Date | null;
        isActive: boolean;
      } | null>()
      .exec();
    if (!user?.isActive)
      throw new NotFoundException('Utilisateur introuvable.');
    if (
      !user.pendingNeighborhoodId ||
      !user.pendingNeighborhoodExpiresAt ||
      user.pendingNeighborhoodExpiresAt.getTime() <= Date.now()
    ) {
      throw new ConflictException(
        'La résolution a expiré. Localisez à nouveau votre quartier.',
      );
    }
    const neighborhood = await this.findActiveDocument(
      user.pendingNeighborhoodId,
    );
    const now = new Date();
    const result = await this.userModel
      .updateOne(
        {
          _id: userId,
          pendingNeighborhoodId: neighborhood.slug,
          pendingNeighborhoodExpiresAt: { $gt: now },
        },
        {
          $set: {
            neighborhoodId: neighborhood.slug,
            neighborhoodAssignedAt: now,
            neighborhoodAssignmentSource:
              NeighborhoodAssignmentSource.RESIDENT_CONFIRMATION,
            neighborhoodAssignmentActorId: userId,
          },
          $unset: { pendingNeighborhoodId: 1, pendingNeighborhoodExpiresAt: 1 },
          $push: {
            neighborhoodAssignmentHistory: {
              previousNeighborhoodId: user.neighborhoodId || null,
              neighborhoodId: neighborhood.slug,
              source: NeighborhoodAssignmentSource.RESIDENT_CONFIRMATION,
              actorId: userId,
              reason: null,
              occurredAt: now,
            },
          },
        },
      )
      .exec();
    if (result.modifiedCount !== 1) {
      throw new ConflictException(
        'Le rattachement a changé. Relancez la résolution.',
      );
    }
    return {
      assigned: true,
      neighborhood: this.presentPublic(
        neighborhood.toObject() as NeighborhoodRow,
      ),
      exactPositionStored: false,
      sessionRefreshRequired: true,
    };
  }

  async adminList(query: AdminListNeighborhoodsQueryDto) {
    const filter = this.adminFilter(query);
    const rows = await this.neighborhoodModel
      .find(filter)
      .sort({ name: 1 })
      .lean<NeighborhoodRow[]>()
      .exec();
    const stats = await this.loadStats(rows);
    const enriched = rows.map((row) =>
      this.presentAdmin(row, stats.get(this.rowId(row)) ?? EMPTY_STATS),
    );
    enriched.sort((left, right) =>
      this.compareAdminRows(left, right, query.sortBy, query.sortOrder),
    );
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const items = enriched.slice((page - 1) * limit, page * limit);
    return {
      items,
      page,
      limit,
      total: enriched.length,
      totalPages: Math.max(1, Math.ceil(enriched.length / limit)),
      summary: {
        active: rows.filter(
          (row) => this.rowStatus(row) === NeighborhoodStatus.ACTIVE,
        ).length,
        archived: rows.filter(
          (row) => this.rowStatus(row) === NeighborhoodStatus.ARCHIVED,
        ).length,
        withGeometry: rows.filter((row) => Boolean(this.geometryFromRow(row)))
          .length,
      },
    };
  }

  async findAdminOne(id: string) {
    const row = await this.findByIdentifierRow(id);
    if (!row) throw new NotFoundException('Quartier introuvable.');
    const stats = await this.loadStats([row]);
    const members = await this.findMembers(id, 1, 8);
    return {
      ...this.presentAdmin(row, stats.get(this.rowId(row)) ?? EMPTY_STATS),
      membersPreview: members,
    };
  }

  async update(id: string, dto: UpdateNeighborhoodDto, actorId = 'system') {
    const current = await this.findDocument(id);
    const geometry =
      dto.geometry ?? dto.boundary ?? this.geometryFromRow(current);
    if (!geometry) throw new BadRequestException('Une géométrie est requise.');
    const validation = validatePolygon(geometry);
    if (this.rowStatus(current) === NeighborhoodStatus.ACTIVE) {
      await this.assertNoActiveOverlap(geometry, current.id);
    }
    const postalCodes = this.normalizePostalCodes(
      dto.postalCodes?.length
        ? dto.postalCodes
        : dto.postalCode
          ? [dto.postalCode]
          : current.postalCodes?.length
            ? current.postalCodes
            : [current.postalCode],
    );
    const now = new Date();
    const set: Record<string, unknown> = {
      geometry: clonePolygon(geometry),
      boundary: clonePolygon(geometry),
      center: validation.center,
      postalCodes,
      postalCode: postalCodes[0],
    };
    for (const field of ['name', 'description', 'city'] as const) {
      if (dto[field] !== undefined) set[field] = dto[field]?.trim();
    }
    if (dto.slug !== undefined) set.slug = dto.slug.trim().toLowerCase();
    try {
      const updated = await this.neighborhoodModel
        .findOneAndUpdate(
          { _id: current._id },
          {
            $set: set,
            $push: {
              history: {
                type: NeighborhoodAuditType.UPDATED,
                actorId,
                occurredAt: now,
                metadata: { vertices: validation.vertices },
              },
            },
          },
          { returnDocument: 'after', runValidators: true },
        )
        .exec();
      if (!updated) throw new NotFoundException('Quartier introuvable.');
      return updated;
    } catch (error) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException('Un quartier utilise déjà ce slug.');
      }
      throw error;
    }
  }

  async archive(id: string, actorId = 'system') {
    const current = await this.findDocument(id);
    if (this.rowStatus(current) === NeighborhoodStatus.ARCHIVED) return current;
    const now = new Date();
    const neighborhood = await this.neighborhoodModel
      .findOneAndUpdate(
        { _id: current._id, status: { $ne: NeighborhoodStatus.ARCHIVED } },
        {
          $set: {
            isActive: false,
            status: NeighborhoodStatus.ARCHIVED,
            archivedAt: now,
          },
          $push: {
            history: {
              type: NeighborhoodAuditType.ARCHIVED,
              actorId,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!neighborhood)
      throw new ConflictException('Ce quartier a déjà changé.');
    return neighborhood;
  }

  async restore(id: string, actorId: string) {
    const current = await this.findDocument(id);
    if (this.rowStatus(current) === NeighborhoodStatus.ACTIVE) return current;
    const geometry = this.geometryFromRow(current);
    if (geometry) await this.assertNoActiveOverlap(geometry, current.id);
    const now = new Date();
    const neighborhood = await this.neighborhoodModel
      .findOneAndUpdate(
        { _id: current._id, status: NeighborhoodStatus.ARCHIVED },
        {
          $set: {
            isActive: true,
            status: NeighborhoodStatus.ACTIVE,
            archivedAt: null,
          },
          $push: {
            history: {
              type: NeighborhoodAuditType.RESTORED,
              actorId,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();
    if (!neighborhood)
      throw new ConflictException('Ce quartier a déjà changé.');
    return neighborhood;
  }

  async assignUser(
    neighborhoodId: string,
    dto: AssignUserNeighborhoodDto,
    actorId: string,
  ) {
    const neighborhood = await this.findActiveDocument(neighborhoodId);
    const user = await this.userModel
      .findById(dto.userId)
      .select('_id neighborhoodId isActive')
      .lean<{
        _id: unknown;
        neighborhoodId: string;
        isActive: boolean;
      } | null>()
      .exec();
    if (!user?.isActive)
      throw new NotFoundException('Utilisateur introuvable.');
    const now = new Date();
    const source = NeighborhoodAssignmentSource.ADMIN;
    const update = await this.userModel
      .updateOne(
        { _id: dto.userId, isActive: true },
        {
          $set: {
            neighborhoodId: neighborhood.slug,
            neighborhoodAssignedAt: now,
            neighborhoodAssignmentSource: source,
            neighborhoodAssignmentActorId: actorId,
          },
          $unset: { pendingNeighborhoodId: 1, pendingNeighborhoodExpiresAt: 1 },
          $push: {
            neighborhoodAssignmentHistory: {
              previousNeighborhoodId: user.neighborhoodId || null,
              neighborhoodId: neighborhood.slug,
              source,
              actorId,
              reason: dto.justification.trim(),
              occurredAt: now,
            },
          },
        },
      )
      .exec();
    if (update.modifiedCount !== 1) {
      throw new ConflictException('Le rattachement utilisateur a changé.');
    }
    await this.neighborhoodModel
      .updateOne(
        { _id: neighborhood._id },
        {
          $push: {
            history: {
              type: NeighborhoodAuditType.USER_ASSIGNED,
              actorId,
              occurredAt: now,
              metadata: { userId: dto.userId },
            },
          },
        },
      )
      .exec();
    return {
      assigned: true,
      userId: dto.userId,
      neighborhood: this.presentPublic(
        neighborhood.toObject() as NeighborhoodRow,
      ),
      assignedAt: now,
      sessionRefreshRequired: true,
    };
  }

  async containsPoint(id: string, dto: ContainsPointDto) {
    const neighborhood = await this.findDocument(id);
    validatePoint(dto.point);
    const geometry = this.geometryFromRow(neighborhood);
    return {
      neighborhoodId: neighborhood.id,
      contains: geometry ? pointInsidePolygon(dto.point, geometry) : false,
    };
  }

  async findMembers(id: string, page = 1, limit = 20) {
    const neighborhood = await this.findDocument(id);
    const identifiers = this.neighborhoodIdentifiers(neighborhood);
    const [items, total] = await Promise.all([
      this.userModel
        .find({ neighborhoodId: { $in: identifiers } })
        .select(
          '_id displayName email role isActive neighborhoodId neighborhoodAssignedAt',
        )
        .sort({ displayName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel
        .countDocuments({ neighborhoodId: { $in: identifiers } })
        .exec(),
    ]);
    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getStats(id: string) {
    const row = await this.findByIdentifierRow(id);
    if (!row) throw new NotFoundException('Quartier introuvable.');
    const stats = await this.loadStats([row]);
    return {
      neighborhoodId: this.rowId(row),
      slug: row.slug,
      ...(stats.get(this.rowId(row)) ?? EMPTY_STATS),
    };
  }

  private async loadStats(rows: NeighborhoodRow[]) {
    const identifiers = rows.flatMap((row) => [this.rowId(row), row.slug]);
    const pipeline = [
      { $match: { neighborhoodId: { $in: identifiers } } },
      { $group: { _id: '$neighborhoodId', count: { $sum: 1 } } },
    ];
    const [users, services, incidents, events, votes] = await Promise.all([
      this.userModel.aggregate<CountRow>(pipeline).exec(),
      this.serviceModel.aggregate<CountRow>(pipeline).exec(),
      this.incidentModel.aggregate<CountRow>(pipeline).exec(),
      this.eventModel.aggregate<CountRow>(pipeline).exec(),
      this.voteModel.aggregate<CountRow>(pipeline).exec(),
    ]);
    const userMap = new Map(users.map((row) => [row._id, row.count]));
    const serviceMap = new Map(services.map((row) => [row._id, row.count]));
    const incidentMap = new Map(incidents.map((row) => [row._id, row.count]));
    const eventMap = new Map(events.map((row) => [row._id, row.count]));
    const voteMap = new Map(votes.map((row) => [row._id, row.count]));
    return new Map(
      rows.map((row) => {
        const ids = [this.rowId(row), row.slug];
        const pick = (map: Map<string, number>) =>
          ids.reduce((sum, identifier) => sum + (map.get(identifier) ?? 0), 0);
        return [
          this.rowId(row),
          {
            users: pick(userMap),
            services: pick(serviceMap),
            incidents: pick(incidentMap),
            events: pick(eventMap),
            votes: pick(voteMap),
          },
        ];
      }),
    );
  }

  private async assertNoActiveOverlap(
    geometry: GeoJsonPolygon,
    excludeId?: string,
  ) {
    const rows = await this.neighborhoodModel
      .find(this.activeFilter())
      .select('_id name slug geometry boundary')
      .lean<NeighborhoodRow[]>()
      .exec();
    const conflict = rows.find((row) => {
      if (excludeId && this.rowId(row) === excludeId) return false;
      const existing = this.geometryFromRow(row);
      return existing ? polygonsOverlap(geometry, existing) : false;
    });
    if (conflict) {
      throw new ConflictException(
        `La zone chevauche le quartier actif « ${conflict.name} ».`,
      );
    }
  }

  private async ensureDemoNeighborhoods() {
    for (const demo of DEMO_NEIGHBORHOODS) {
      const existing = await this.neighborhoodModel
        .findOne({ slug: demo.slug })
        .exec();
      const validation = validatePolygon(demo.geometry);
      if (!existing) {
        await this.neighborhoodModel.create({
          ...demo,
          boundary: clonePolygon(demo.geometry),
          center: validation.center,
          createdById: 'system',
          isActive: demo.status === NeighborhoodStatus.ACTIVE,
          archivedAt:
            demo.status === NeighborhoodStatus.ARCHIVED ? new Date(0) : null,
          history: [],
        });
        continue;
      }
      const patch: Record<string, unknown> = {};
      if (!existing.geometry) patch.geometry = clonePolygon(demo.geometry);
      if (!existing.boundary) patch.boundary = clonePolygon(demo.geometry);
      if (!existing.center) patch.center = validation.center;
      if (!existing.postalCodes?.length) patch.postalCodes = demo.postalCodes;
      if (Object.keys(patch).length > 0) {
        await this.neighborhoodModel
          .updateOne({ _id: existing._id }, { $set: patch })
          .exec();
      }
    }
  }

  private presentPublic(row: NeighborhoodRow) {
    return {
      id: this.rowId(row),
      name: row.name,
      slug: row.slug,
      description: row.description,
      city: row.city,
      postalCode: row.postalCode,
      postalCodes: row.postalCodes?.length ? row.postalCodes : [row.postalCode],
      status: this.rowStatus(row),
      geometryDefined: Boolean(this.geometryFromRow(row)),
      center: row.center ?? null,
      createdAt: row.createdAt ?? null,
      updatedAt: row.updatedAt ?? null,
    };
  }

  private presentAdmin(row: NeighborhoodRow, stats: NeighborhoodStats) {
    const geometry = this.geometryFromRow(row);
    return {
      ...this.presentPublic(row),
      geometry,
      boundary: geometry,
      createdById: row.createdById,
      archivedAt: row.archivedAt ?? null,
      history: row.history ?? [],
      stats,
    };
  }

  private adminFilter(query: AdminListNeighborhoodsQueryDto) {
    const clauses: Array<Record<string, unknown>> = [];
    if (query.status) clauses.push({ status: query.status });
    if (query.city?.trim()) clauses.push({ city: query.city.trim() });
    if (query.postalCode?.trim()) {
      clauses.push({
        $or: [
          { postalCode: query.postalCode.trim() },
          { postalCodes: query.postalCode.trim() },
        ],
      });
    }
    if (query.search?.trim()) {
      const regex = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      clauses.push({
        $or: [
          { name: regex },
          { slug: regex },
          { city: regex },
          { postalCode: regex },
          { postalCodes: regex },
        ],
      });
    }
    return clauses.length ? { $and: clauses } : {};
  }

  private compareAdminRows(
    left: ReturnType<NeighborhoodsService['presentAdmin']>,
    right: ReturnType<NeighborhoodsService['presentAdmin']>,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
  ) {
    const value = (row: typeof left): string | number => {
      if (sortBy === 'residents') return row.stats.users;
      if (sortBy === 'services') return row.stats.services;
      if (sortBy === 'createdAt') return row.createdAt?.getTime() ?? 0;
      if (sortBy === 'updatedAt') return row.updatedAt?.getTime() ?? 0;
      if (sortBy === 'city') return row.city;
      if (sortBy === 'status') return row.status;
      return row.name;
    };
    const leftValue = value(left);
    const rightValue = value(right);
    const result =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), 'fr', {
            sensitivity: 'base',
          });
    return sortOrder === 'asc' ? result : -result;
  }

  private async findDocument(id: string) {
    const neighborhood = await this.neighborhoodModel
      .findOne(this.identifierFilter(id))
      .exec();
    if (!neighborhood) throw new NotFoundException('Quartier introuvable.');
    return neighborhood;
  }

  private async findActiveDocument(id: string) {
    const neighborhood = await this.neighborhoodModel
      .findOne({ $and: [this.identifierFilter(id), this.activeFilter()] })
      .exec();
    if (!neighborhood) {
      throw new ConflictException(
        'Ce quartier est introuvable ou n’accepte plus de rattachement.',
      );
    }
    return neighborhood;
  }

  private async findByIdentifierRow(id: string) {
    return this.neighborhoodModel
      .findOne(this.identifierFilter(id))
      .lean<NeighborhoodRow | null>()
      .exec();
  }

  private identifierFilter(id: string) {
    const filters: Array<Record<string, unknown>> = [{ slug: id }];
    if (Types.ObjectId.isValid(id)) filters.push({ _id: id });
    return { $or: filters };
  }

  private activeFilter() {
    return {
      $and: [
        {
          $or: [
            { status: NeighborhoodStatus.ACTIVE },
            { status: { $exists: false } },
          ],
        },
        { isActive: { $ne: false } },
      ],
    };
  }

  private geometryFromInput(
    dto: CreateNeighborhoodDto | UpdateNeighborhoodDto,
  ) {
    const geometry = dto.geometry ?? dto.boundary;
    if (!geometry) throw new BadRequestException('Une géométrie est requise.');
    return geometry;
  }

  private geometryFromRow(row: Pick<Neighborhood, 'geometry' | 'boundary'>) {
    return row.geometry ?? row.boundary ?? null;
  }

  private neighborhoodIdentifiers(neighborhood: NeighborhoodDocument) {
    return [neighborhood.id, neighborhood.slug].filter(Boolean);
  }

  private rowId(row: { _id: unknown }) {
    return String(row._id);
  }

  private rowStatus(row: Pick<Neighborhood, 'status' | 'isActive'>) {
    return (
      row.status ??
      (row.isActive === false
        ? NeighborhoodStatus.ARCHIVED
        : NeighborhoodStatus.ACTIVE)
    );
  }

  private normalizePostalCodes(values: string[]) {
    const postalCodes = [
      ...new Set(values.map((value) => value.trim()).filter(Boolean)),
    ];
    if (postalCodes.length === 0) {
      throw new BadRequestException('Au moins un code postal est requis.');
    }
    if (postalCodes.some((value) => value.length > 20)) {
      throw new BadRequestException('Un code postal est trop long.');
    }
    return postalCodes;
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private isDuplicateKey(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}

function rectangle(
  minLongitude: number,
  minLatitude: number,
  maxLongitude: number,
  maxLatitude: number,
): GeoJsonPolygon {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [minLongitude, minLatitude],
        [maxLongitude, minLatitude],
        [maxLongitude, maxLatitude],
        [minLongitude, maxLatitude],
        [minLongitude, minLatitude],
      ],
    ],
  };
}
