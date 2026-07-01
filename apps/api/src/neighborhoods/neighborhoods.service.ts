import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument } from '../auth/schemas/user.schema';
import { NeighborhoodEvent, EventDocument } from '../events/schemas/event.schema';
import { Incident, IncidentDocument } from '../incidents/schemas/incident.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Vote, VoteDocument } from '../votes/schemas/vote.schema';
import { ContainsPointDto } from './dto/contains-point.dto';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import {
  GeoJsonPolygon,
  Neighborhood,
  NeighborhoodDocument,
  NeighborhoodStatus,
} from './schemas/neighborhood.schema';

const DEMO_NEIGHBORHOOD: CreateNeighborhoodDto = {
  name: 'Quartier Centre',
  slug: 'quartier-centre',
  description: 'Quartier de demonstration pour le parcours Connected Neighbours.',
  city: 'Paris',
  postalCode: '75001',
  boundary: {
    type: 'Polygon',
    coordinates: [
      [
        [2.3408, 48.8517],
        [2.3608, 48.8517],
        [2.3608, 48.8617],
        [2.3408, 48.8617],
        [2.3408, 48.8517],
      ],
    ],
  },
};

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
    if (process.env.DEV_AUTH_SEED !== 'true') {
      return;
    }

    await this.ensureDemoNeighborhood();
  }

  async create(dto: CreateNeighborhoodDto, createdById: string) {
    this.assertValidPolygon(dto.boundary);

    return this.neighborhoodModel.create({
      ...dto,
      slug: dto.slug.toLowerCase(),
      createdById,
      status: NeighborhoodStatus.ACTIVE,
      isActive: true,
    });
  }

  async findAll(includeArchived = false) {
    const filter = includeArchived
      ? {}
      : {
          $or: [
            { status: NeighborhoodStatus.ACTIVE },
            { status: { $exists: false } },
          ],
          isActive: { $ne: false },
        };

    return this.neighborhoodModel
      .find(filter)
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string) {
    const neighborhood = await this.findByIdentifier(id);

    if (!neighborhood) {
      throw new NotFoundException(`Quartier ${id} introuvable`);
    }

    return neighborhood;
  }

  async update(id: string, dto: UpdateNeighborhoodDto) {
    if (dto.boundary) {
      this.assertValidPolygon(dto.boundary);
    }

    const payload = {
      ...dto,
      ...(dto.slug ? { slug: dto.slug.toLowerCase() } : {}),
      ...(dto.status
        ? { isActive: dto.status === NeighborhoodStatus.ACTIVE }
        : {}),
    };

    const neighborhood = await this.neighborhoodModel
      .findOneAndUpdate(this.identifierFilter(id), payload, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();

    if (!neighborhood) {
      throw new NotFoundException(`Quartier ${id} introuvable`);
    }

    return neighborhood;
  }

  async archive(id: string) {
    const neighborhood = await this.neighborhoodModel
      .findOneAndUpdate(
        this.identifierFilter(id),
        {
          isActive: false,
          status: NeighborhoodStatus.ARCHIVED,
        },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!neighborhood) {
      throw new NotFoundException(`Quartier ${id} introuvable`);
    }

    return {
      archived: true,
      id: neighborhood.id,
      neighborhood,
    };
  }

  async containsPoint(id: string, dto: ContainsPointDto) {
    const neighborhood = await this.findOne(id);
    this.assertValidPoint(dto.point);

    return {
      neighborhoodId: neighborhood.id,
      point: dto.point,
      contains: this.isPointInsidePolygon(dto.point, neighborhood.boundary),
    };
  }

  async findMembers(id: string) {
    const neighborhood = await this.findOne(id);
    const identifiers = this.neighborhoodIdentifiers(neighborhood);

    return this.userModel
      .find({ neighborhoodId: { $in: identifiers } })
      .select('-passwordHash')
      .sort({ displayName: 1 })
      .lean()
      .exec();
  }

  async getStats(id: string) {
    const neighborhood = await this.findOne(id);
    const identifiers = this.neighborhoodIdentifiers(neighborhood);
    const match = { neighborhoodId: { $in: identifiers } };

    const [users, services, incidents, events, votes] = await Promise.all([
      this.userModel.countDocuments(match).exec(),
      this.serviceModel.countDocuments(match).exec(),
      this.incidentModel.countDocuments(match).exec(),
      this.eventModel.countDocuments(match).exec(),
      this.voteModel.countDocuments(match).exec(),
    ]);

    return {
      neighborhoodId: neighborhood.id,
      slug: neighborhood.slug,
      users,
      services,
      incidents,
      events,
      votes,
    };
  }

  private async ensureDemoNeighborhood() {
    const existing = await this.neighborhoodModel
      .findOne({ slug: DEMO_NEIGHBORHOOD.slug })
      .exec();

    if (!existing) {
      await this.neighborhoodModel.create({
        ...DEMO_NEIGHBORHOOD,
        createdById: 'system',
        status: NeighborhoodStatus.ACTIVE,
        isActive: true,
      });
      return;
    }

    const patch: Partial<Neighborhood> = {};

    if (!existing.description) {
      patch.description = DEMO_NEIGHBORHOOD.description;
    }

    if (!existing.city) {
      patch.city = DEMO_NEIGHBORHOOD.city;
    }

    if (!existing.postalCode) {
      patch.postalCode = DEMO_NEIGHBORHOOD.postalCode;
    }

    if (!existing.boundary) {
      patch.boundary = DEMO_NEIGHBORHOOD.boundary;
    }

    if (!existing.status) {
      patch.status = existing.isActive
        ? NeighborhoodStatus.ACTIVE
        : NeighborhoodStatus.ARCHIVED;
    }

    if (existing.status !== NeighborhoodStatus.ACTIVE) {
      patch.status = NeighborhoodStatus.ACTIVE;
    }

    if (existing.isActive !== true) {
      patch.isActive = true;
    }

    if (Object.keys(patch).length > 0) {
      Object.assign(existing, patch);
      await existing.save();
    }
  }

  private async findByIdentifier(id: string) {
    return this.neighborhoodModel.findOne(this.identifierFilter(id)).exec();
  }

  private identifierFilter(id: string) {
    const filters: Array<Record<string, unknown>> = [{ slug: id }];

    if (Types.ObjectId.isValid(id)) {
      filters.push({ _id: id });
    }

    return { $or: filters };
  }

  private neighborhoodIdentifiers(neighborhood: NeighborhoodDocument) {
    return [neighborhood.id, neighborhood.slug].filter(Boolean);
  }

  private assertValidPolygon(value: GeoJsonPolygon) {
    if (!value || value.type !== 'Polygon' || !Array.isArray(value.coordinates)) {
      throw new BadRequestException('Le GeoJSON doit etre un Polygon valide');
    }

    const outerRing = value.coordinates[0];

    if (!Array.isArray(outerRing) || outerRing.length < 4) {
      throw new BadRequestException('Un polygone doit contenir au moins 4 points');
    }

    for (const point of outerRing) {
      this.assertValidPoint(point);
    }

    const first = outerRing[0];
    const last = outerRing[outerRing.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw new BadRequestException(
        'Le premier point du polygone doit etre identique au dernier',
      );
    }
  }

  private assertValidPoint(point: unknown): asserts point is [number, number] {
    if (!Array.isArray(point) || point.length !== 2) {
      throw new BadRequestException('Un point doit etre [longitude, latitude]');
    }

    const [longitude, latitude] = point;

    if (
      typeof longitude !== 'number' ||
      Number.isNaN(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException('La longitude doit etre comprise entre -180 et 180');
    }

    if (
      typeof latitude !== 'number' ||
      Number.isNaN(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new BadRequestException('La latitude doit etre comprise entre -90 et 90');
    }
  }

  private isPointInsidePolygon(point: [number, number], polygon: GeoJsonPolygon) {
    const ring = polygon.coordinates[0];
    const [longitude, latitude] = point;
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersects =
        yi > latitude !== yj > latitude &&
        longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;

      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }
}
