import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { isValidObjectId, Model } from 'mongoose';

import type { AuthenticatedUser } from '../auth/authenticated-user.type';
import { Role } from '../auth/role.enum';
import { GraphSyncService } from '../graph/graph-sync.service';
import { GraphEntityType, GraphSyncOperation } from '../graph/graph.types';
import {
  Neighborhood,
  NeighborhoodDocument,
  NeighborhoodStatus,
} from '../neighborhoods/schemas/neighborhood.schema';
import { PublicUsersService } from '../users/public-users.service';
import { CancelEventDto } from './dto/cancel-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { RespondEventDto } from './dto/respond-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  normalizeEventRecord,
  normalizeEventResponseRecord,
} from './event-normalization';
import {
  EventResponse,
  EventResponseDocument,
  EventResponseStatus,
} from './schemas/event-response.schema';
import {
  EventAuditType,
  EventCategory,
  EventDocument,
  EventStatus,
  NeighborhoodEvent,
} from './schemas/event.schema';

type EventActor = Pick<AuthenticatedUser, 'sub' | 'role' | 'neighborhoodId'>;
type EventRow = {
  _id: unknown;
  organizerId: string;
  neighborhoodId: string;
  status: EventStatus;
  startsAt: Date;
  endsAt?: Date | null;
  registrationDeadline?: Date | null;
  capacity?: number | null;
  participantCount?: number;
  waitlistCount?: number;
  history?: unknown[];
};
type EventFilter = Record<string, unknown>;

const ACTIVE_RESPONSES = [
  EventResponseStatus.GOING,
  EventResponseStatus.WAITLISTED,
];
const RESPONDABLE_STATUSES = [
  EventStatus.PUBLISHED,
  EventStatus.OPEN_REGISTRATION,
  EventStatus.FULL,
  EventStatus.SCHEDULED,
];

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(NeighborhoodEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventResponse.name)
    private readonly responseModel: Model<EventResponseDocument>,
    @InjectModel(Neighborhood.name)
    private readonly neighborhoodModel: Model<NeighborhoodDocument>,
    private readonly publicUsersService: PublicUsersService,
    @Optional() private readonly graphSyncService?: GraphSyncService,
  ) {}

  async onModuleInit() {
    const duplicates = await this.responseModel
      .aggregate([
        {
          $group: {
            _id: { eventId: '$eventId', userId: '$userId' },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 5 },
      ])
      .exec();
    if (duplicates.length > 0) {
      this.logger.error(
        `Doublons EventResponse détectés; aucune suppression automatique: ${JSON.stringify(duplicates)}`,
      );
      return;
    }
    await this.ensureResponseUniqueIndex();
  }

  async create(dto: CreateEventDto, actor: EventActor) {
    this.assertCanCreate(dto, actor);
    const requestedNeighborhoodId = await this.resolveActiveNeighborhoodId(
      dto.neighborhoodId,
    );
    const neighborhoodId =
      actor.role === Role.RESIDENT
        ? await this.resolveResidentNeighborhood(actor, requestedNeighborhoodId)
        : requestedNeighborhoodId;
    const dates = this.validateDates(
      dto.startsAt,
      dto.endsAt,
      dto.registrationDeadline,
    );
    const now = new Date();
    const event = await this.eventModel.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      neighborhoodId,
      organizerId: actor.sub,
      ...dates,
      locationLabel: dto.locationLabel,
      capacity: dto.capacity ?? null,
      minimumAge: dto.minimumAge ?? null,
      accessibilityInformation: dto.accessibilityInformation ?? null,
      equipmentInformation: dto.equipmentInformation ?? null,
      contactInstructions: dto.contactInstructions ?? null,
      status: EventStatus.DRAFT,
      history: [
        {
          type: EventAuditType.CREATED,
          actorId: actor.sub,
          occurredAt: now,
          metadata: {},
        },
      ],
    });
    this.queueGraphProjection(event.id);
    return this.presentOne(event.toObject() as EventRow, actor);
  }

  async findAll(query: ListEventsQueryDto, actor: EventActor, admin = false) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter = await this.buildListFilter(query, actor, admin);
    const sort: Record<string, 1 | -1> =
      query.sort === 'latest'
        ? { startsAt: -1 }
        : query.sort === 'popular'
          ? { participantCount: -1, startsAt: 1 }
          : { startsAt: 1 };
    const [rows, total] = await Promise.all([
      this.eventModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<EventRow[]>()
        .exec(),
      this.eventModel.countDocuments(filter).exec(),
    ]);
    return {
      items: await this.presentMany(rows, actor, admin),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findLegacy(neighborhoodId: string | undefined, actor: EventActor) {
    const page = await this.findAll({ neighborhoodId, limit: 100 }, actor);
    return page.items;
  }

  async discover(actor: EventActor, category?: string) {
    const answered = await this.responseModel.distinct('eventId', {
      userId: actor.sub,
    });
    const now = new Date();
    const filter: EventFilter = {
      neighborhoodId: actor.neighborhoodId,
      organizerId: { $ne: actor.sub },
      _id: { $nin: answered },
      status: { $in: RESPONDABLE_STATUSES },
      startsAt: { $gt: now },
      $or: [
        { registrationDeadline: null },
        { registrationDeadline: { $gt: now } },
        { registrationDeadline: { $exists: false } },
      ],
    };
    if (category) filter.category = category;
    const rows = await this.eventModel
      .find(filter)
      .sort({ participantCount: -1, startsAt: 1 })
      .limit(30)
      .lean<EventRow[]>()
      .exec();
    return {
      recommendationSource: 'neighborhood_fallback',
      items: await this.presentMany(rows, actor),
    };
  }

  async recommend(actor: EventActor) {
    return this.discover(actor);
  }

  async findOne(id: string, actor?: EventActor, admin = false) {
    const event = await this.findDocument(id);
    if (actor) this.assertCanView(event, actor, admin);
    return actor
      ? this.presentOne(event.toObject() as EventRow, actor, admin)
      : normalizeEventRecord(event.toObject() as EventRow);
  }

  async findMyCreated(actor: EventActor) {
    const rows = await this.eventModel
      .find({ organizerId: actor.sub })
      .sort({ createdAt: -1 })
      .lean<EventRow[]>()
      .exec();
    return this.presentMany(rows, actor);
  }

  async update(id: string, dto: UpdateEventDto, actor: EventActor) {
    const event = await this.findDocument(id);
    this.assertOrganizerOrAdmin(event, actor);
    if (
      !RESPONDABLE_STATUSES.concat(EventStatus.DRAFT).includes(event.status)
    ) {
      throw new ConflictException('Cet événement ne peut plus être modifié.');
    }
    if (event.startsAt.getTime() <= Date.now()) {
      throw new ConflictException(
        'Un événement commencé ne peut plus être déplacé.',
      );
    }
    const dates = this.validateDates(
      dto.startsAt ?? event.startsAt,
      dto.endsAt ?? event.endsAt,
      dto.registrationDeadline ?? event.registrationDeadline ?? undefined,
    );
    const update = { ...dto, ...dates } as Record<string, unknown>;
    delete update.status;
    const now = new Date();
    const updated = await this.eventModel
      .findOneAndUpdate(
        { _id: id, status: event.status },
        {
          $set: update,
          $push: {
            history: {
              type: EventAuditType.UPDATED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<EventRow>()
      .exec();
    if (!updated)
      throw new ConflictException('L’événement a changé. Rechargez la page.');
    this.queueGraphProjection(id);
    return this.presentOne(updated, actor);
  }

  async remove(id: string, actor: EventActor) {
    const event = await this.findDocument(id);
    this.assertOrganizerOrAdmin(event, actor);
    if (event.status !== EventStatus.DRAFT) {
      throw new ConflictException(
        'Seul un brouillon sans réponse peut être supprimé.',
      );
    }
    if (await this.responseModel.exists({ eventId: id })) {
      throw new ConflictException(
        'Ce brouillon possède déjà un historique de réponses.',
      );
    }
    await event.deleteOne();
    this.queueGraphProjection(id, GraphSyncOperation.DELETE);
    return { deleted: true };
  }

  async publish(id: string, actor: EventActor) {
    const event = await this.findDocument(id);
    this.assertOrganizerOrAdmin(event, actor);
    this.validateDates(
      event.startsAt,
      event.endsAt,
      event.registrationDeadline ?? undefined,
      true,
    );
    if (event.status !== EventStatus.DRAFT)
      throw new ConflictException('Seul un brouillon peut être publié.');
    const now = new Date();
    const updated = await this.eventModel
      .findOneAndUpdate(
        { _id: id, status: EventStatus.DRAFT, startsAt: { $gt: now } },
        {
          $set: { status: EventStatus.OPEN_REGISTRATION, publishedAt: now },
          $push: {
            history: {
              type: EventAuditType.PUBLISHED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<EventRow>()
      .exec();
    if (!updated)
      throw new ConflictException('Cet événement ne peut plus être publié.');
    this.queueGraphProjection(id);
    return this.presentOne(updated, actor);
  }

  async respond(id: string, actor: EventActor, dto: RespondEventDto) {
    const desired = dto.response ?? dto.interest;
    if (!desired) throw new BadRequestException('Une réponse est requise.');
    await this.assertActiveResidentNeighborhood(actor);
    const event = await this.findDocument(id, true);
    this.assertCanRespond(event, actor);
    await this.ensureCounters(event);
    const claim = randomUUID();
    let claimed: EventResponseDocument | null;
    try {
      claimed = await this.responseModel
        .findOneAndUpdate(
          {
            eventId: id,
            userId: actor.sub,
            $or: [
              { mutationClaim: null },
              { mutationClaim: { $exists: false } },
            ],
          },
          {
            $setOnInsert: {
              eventId: id,
              userId: actor.sub,
              respondedAt: new Date(),
              revision: 0,
            },
            $set: { mutationClaim: claim, mutationClaimedAt: new Date() },
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        )
        .select('+mutationClaim +mutationClaimedAt')
        .exec();
    } catch (error) {
      if (this.isDuplicateKey(error))
        throw new ConflictException(
          'Une autre réponse est déjà en cours. Réessayez.',
        );
      throw error;
    }
    if (!claimed || claimed.mutationClaim !== claim) {
      throw new ConflictException(
        'Une autre réponse est déjà en cours. Réessayez.',
      );
    }

    const previous = normalizeEventResponseRecord(claimed.toObject()).response;
    let seatClaimed = false;
    let seatReleased = false;
    let waitlistClaimed = false;
    let previousWaitlistRemoved = false;
    let shouldPromote = false;
    try {
      if (
        desired === EventResponseStatus.GOING &&
        previous !== EventResponseStatus.GOING
      ) {
        if (previous === EventResponseStatus.WAITLISTED) {
          await this.removeWaitlistCount(id);
          previousWaitlistRemoved = true;
        }
        const seated = await this.claimSeat(id);
        if (seated) {
          seatClaimed = true;
          await this.writeClaimedResponse(
            id,
            actor.sub,
            claim,
            EventResponseStatus.GOING,
            null,
          );
        } else {
          const position = await this.claimWaitlistPosition(id);
          waitlistClaimed = true;
          await this.writeClaimedResponse(
            id,
            actor.sub,
            claim,
            EventResponseStatus.WAITLISTED,
            position,
          );
        }
      } else {
        if (
          previous === EventResponseStatus.GOING &&
          desired !== EventResponseStatus.GOING
        ) {
          await this.eventModel
            .updateOne(
              { _id: id, participantCount: { $gt: 0 } },
              {
                $inc: { participantCount: -1 },
                ...(event.status === EventStatus.FULL
                  ? { $set: { status: EventStatus.OPEN_REGISTRATION } }
                  : {}),
              },
            )
            .exec();
          seatReleased = true;
        }
        if (
          previous === EventResponseStatus.WAITLISTED &&
          desired !== EventResponseStatus.WAITLISTED
        ) {
          await this.removeWaitlistCount(id);
          previousWaitlistRemoved = true;
        }
        await this.writeClaimedResponse(id, actor.sub, claim, desired, null);
        shouldPromote =
          previous === EventResponseStatus.GOING &&
          desired !== EventResponseStatus.GOING;
      }
    } catch (error) {
      const participantDelta = (seatClaimed ? -1 : 0) + (seatReleased ? 1 : 0);
      const waitlistDelta =
        (waitlistClaimed ? -1 : 0) + (previousWaitlistRemoved ? 1 : 0);
      if (participantDelta !== 0 || waitlistDelta !== 0) {
        await this.eventModel
          .updateOne(
            { _id: id },
            {
              $inc: {
                ...(participantDelta !== 0
                  ? { participantCount: participantDelta }
                  : {}),
                ...(waitlistDelta !== 0
                  ? { waitlistCount: waitlistDelta }
                  : {}),
              },
              ...(seatReleased && event.status === EventStatus.FULL
                ? { $set: { status: EventStatus.FULL } }
                : {}),
            },
          )
          .exec();
      }
      await this.responseModel
        .updateOne(
          { eventId: id, userId: actor.sub, mutationClaim: claim },
          { $set: { mutationClaim: null, mutationClaimedAt: null } },
        )
        .exec();
      throw error;
    }
    if (shouldPromote) {
      await this.promoteOldestWaitlisted(id);
    }

    const response = await this.responseModel
      .findOne({ eventId: id, userId: actor.sub })
      .lean()
      .exec();
    const refreshed = await this.findDocument(id);
    this.queueGraphProjection(id);
    return {
      response: response ? normalizeEventResponseRecord(response) : null,
      event: await this.presentOne(refreshed.toObject() as EventRow, actor),
    };
  }

  join(id: string, actor: EventActor) {
    return this.respond(id, actor, { response: EventResponseStatus.GOING });
  }

  leave(id: string, actor: EventActor) {
    return this.respond(id, actor, { response: EventResponseStatus.CANCELLED });
  }

  async findMyResponses(actor: EventActor) {
    const rows = await this.responseModel
      .find({ userId: actor.sub })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    const events = await this.eventModel
      .find({ _id: { $in: rows.map((row) => row.eventId) } })
      .lean<EventRow[]>()
      .exec();
    const presented = await this.presentMany(events, actor);
    const eventMap = new Map(presented.map((event) => [event.id, event]));
    return rows.map((row) => ({
      ...normalizeEventResponseRecord(row),
      event: eventMap.get(row.eventId) ?? null,
    }));
  }

  async participants(id: string, actor: EventActor, admin = false) {
    const event = await this.findDocument(id);
    if (!admin && event.organizerId !== actor.sub) {
      throw new ForbiddenException(
        'Seul l’organisateur peut consulter les participants.',
      );
    }
    const rows = await this.responseModel
      .find({
        eventId: id,
        $or: [
          { response: { $in: ACTIVE_RESPONSES } },
          { interest: { $in: ACTIVE_RESPONSES } },
        ],
      })
      .sort({ response: 1, respondedAt: 1, _id: 1 })
      .lean()
      .exec();
    const profiles = await this.publicUsersService.findByIds(
      rows.map((row) => row.userId),
    );
    return rows.map((row) => ({
      ...normalizeEventResponseRecord(row),
      user: profiles.get(row.userId) ?? null,
    }));
  }

  async cancel(
    id: string,
    dto: CancelEventDto,
    actor: EventActor,
    admin = false,
  ) {
    const event = await this.findDocument(id);
    if (!admin) this.assertOrganizerOrAdmin(event, actor);
    if (
      [
        EventStatus.CANCELLED,
        EventStatus.COMPLETED,
        EventStatus.ARCHIVED,
      ].includes(event.status)
    ) {
      throw new ConflictException('Cet événement ne peut plus être annulé.');
    }
    const now = new Date();
    const updated = await this.eventModel
      .findOneAndUpdate(
        { _id: id, status: event.status },
        {
          $set: {
            status: EventStatus.CANCELLED,
            cancellationReason: dto.reason,
            cancelledAt: now,
          },
          $push: {
            history: {
              type: EventAuditType.CANCELLED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: { reason: dto.reason },
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<EventRow>()
      .exec();
    if (!updated)
      throw new ConflictException('L’événement a changé. Rechargez la page.');
    this.queueGraphProjection(id);
    return this.presentOne(updated, actor, admin);
  }

  async start(id: string, actor: EventActor) {
    const event = await this.findDocument(id);
    this.assertOrganizerOrAdmin(event, actor);
    if (!RESPONDABLE_STATUSES.includes(event.status)) {
      throw new ConflictException('Cet événement ne peut pas être démarré.');
    }
    const now = new Date();
    const updated = await this.eventModel
      .findOneAndUpdate(
        {
          _id: id,
          status: event.status,
          startsAt: { $lte: now },
          endsAt: { $gt: now },
        },
        {
          $set: { status: EventStatus.STARTED, startedAt: now },
          $push: {
            history: {
              type: EventAuditType.STARTED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<EventRow>()
      .exec();
    if (!updated) {
      throw new ConflictException(
        'L’événement ne peut être démarré qu’à partir de son heure de début.',
      );
    }
    this.queueGraphProjection(id);
    return this.presentOne(updated, actor);
  }

  async complete(id: string, actor: EventActor) {
    const event = await this.findDocument(id);
    this.assertOrganizerOrAdmin(event, actor);
    const completable = [
      EventStatus.STARTED,
      EventStatus.OPEN_REGISTRATION,
      EventStatus.FULL,
      EventStatus.SCHEDULED,
    ];
    if (!completable.includes(event.status))
      throw new ConflictException('Cet événement ne peut pas être terminé.');
    const now = new Date();
    if (
      event.status !== EventStatus.STARTED &&
      event.endsAt.getTime() > now.getTime()
    ) {
      throw new ConflictException('L’événement n’est pas encore terminé.');
    }
    const updated = await this.eventModel
      .findOneAndUpdate(
        { _id: id, status: event.status },
        {
          $set: { status: EventStatus.COMPLETED, completedAt: now },
          $push: {
            history: {
              type: EventAuditType.COMPLETED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<EventRow>()
      .exec();
    if (!updated)
      throw new ConflictException('L’événement a changé. Rechargez la page.');
    this.queueGraphProjection(id);
    return this.presentOne(updated, actor);
  }

  async archive(id: string, actor: EventActor, admin = false) {
    const event = await this.findDocument(id);
    if (!admin) this.assertOrganizerOrAdmin(event, actor);
    if (
      ![EventStatus.COMPLETED, EventStatus.CANCELLED].includes(event.status)
    ) {
      throw new ConflictException(
        'Seul un événement terminé ou annulé peut être archivé.',
      );
    }
    const now = new Date();
    const updated = await this.eventModel
      .findOneAndUpdate(
        { _id: id, status: event.status },
        {
          $set: { status: EventStatus.ARCHIVED, archivedAt: now },
          $push: {
            history: {
              type: EventAuditType.ARCHIVED,
              actorId: actor.sub,
              occurredAt: now,
              metadata: {},
            },
          },
        },
        { returnDocument: 'after' },
      )
      .lean<EventRow>()
      .exec();
    if (!updated)
      throw new ConflictException('L’événement a changé. Rechargez la page.');
    this.queueGraphProjection(id);
    return this.presentOne(updated, actor, admin);
  }

  async presentRecommendations(rows: EventRow[], actor: EventActor) {
    return this.presentMany(rows, actor);
  }

  private queueGraphProjection(
    eventId: string,
    operation = GraphSyncOperation.UPSERT,
  ) {
    void this.graphSyncService?.enqueue(
      GraphEntityType.EVENT,
      eventId,
      operation,
    );
  }

  async homeSummary(actor: EventActor) {
    const now = new Date();
    const [rows, participatingIds] = await Promise.all([
      this.eventModel
        .find({
          neighborhoodId: actor.neighborhoodId,
          status: { $in: RESPONDABLE_STATUSES },
          startsAt: { $gt: now },
        })
        .sort({ startsAt: 1 })
        .limit(4)
        .lean<EventRow[]>()
        .exec(),
      this.responseModel.distinct('eventId', {
        userId: actor.sub,
        $or: [
          { response: EventResponseStatus.GOING },
          { interest: EventResponseStatus.GOING },
        ],
      }),
    ]);
    return {
      upcomingEvents: await this.presentMany(rows, actor),
      myUpcomingEventsCount: await this.eventModel
        .countDocuments({
          _id: { $in: participatingIds },
          startsAt: { $gt: now },
          status: { $nin: [EventStatus.CANCELLED, EventStatus.ARCHIVED] },
        })
        .exec(),
    };
  }

  private async buildListFilter(
    query: ListEventsQueryDto,
    actor: EventActor,
    admin: boolean,
  ) {
    const filter: EventFilter = {};
    filter.neighborhoodId = admin
      ? (query.neighborhoodId ?? { $exists: true })
      : actor.neighborhoodId;
    if (query.search) {
      filter.$or = [
        { title: this.regex(query.search) },
        { description: this.regex(query.search) },
        { locationLabel: this.regex(query.search) },
      ];
    }
    if (query.category) filter.category = query.category;
    if (query.status) {
      filter.status =
        query.status === EventStatus.OPEN_REGISTRATION
          ? { $in: [EventStatus.OPEN_REGISTRATION, EventStatus.SCHEDULED] }
          : query.status;
    } else if (!admin) {
      filter.status = { $nin: [EventStatus.CANCELLED, EventStatus.ARCHIVED] };
    }
    if (query.from || query.to) {
      filter.startsAt = {
        ...(query.from ? { $gte: query.from } : {}),
        ...(query.to ? { $lte: query.to } : {}),
      };
    }
    if (query.organizer === 'me') filter.organizerId = actor.sub;
    if (admin && query.organizerId) filter.organizerId = query.organizerId;
    if (!admin) {
      filter.$and = [
        {
          $or: [
            { status: { $ne: EventStatus.DRAFT } },
            { organizerId: actor.sub },
          ],
        },
      ];
    }
    if (query.response) {
      const ids = await this.responseModel.distinct('eventId', {
        userId: actor.sub,
        $or: [{ response: query.response }, { interest: query.response }],
      });
      filter._id = { $in: ids };
    }
    if (query.full === true) {
      filter.capacity = { $ne: null };
      filter.$expr = { $gte: ['$participantCount', '$capacity'] };
    }
    if (query.full === false) {
      const available = {
        $or: [
          { capacity: null },
          { capacity: { $exists: false } },
          { $expr: { $lt: ['$participantCount', '$capacity'] } },
        ],
      };
      filter.$and = [...((filter.$and as EventFilter[]) ?? []), available];
    }
    return filter;
  }

  private async presentMany(
    rows: EventRow[],
    actor: EventActor,
    admin = false,
  ) {
    if (rows.length === 0) return [];
    const eventIds = rows.map((row) => String(row._id));
    const neighborhoodIds = [...new Set(rows.map((row) => row.neighborhoodId))];
    const neighborhoodObjectIds = neighborhoodIds.filter((id) =>
      isValidObjectId(id),
    );
    const neighborhoodFilters: EventFilter[] = [
      { slug: { $in: neighborhoodIds } },
    ];
    if (neighborhoodObjectIds.length > 0) {
      neighborhoodFilters.push({ _id: { $in: neighborhoodObjectIds } });
    }
    const [profiles, neighborhoods, groupedResponses, viewerResponses] =
      await Promise.all([
        this.publicUsersService.findByIds(rows.map((row) => row.organizerId)),
        this.neighborhoodModel
          .find({ $or: neighborhoodFilters })
          .select('_id slug name city')
          .lean()
          .exec(),
        this.responseModel
          .aggregate<{
            _id: { eventId: string; response: string };
            count: number;
          }>([
            { $match: { eventId: { $in: eventIds } } },
            {
              $project: {
                eventId: 1,
                response: { $ifNull: ['$response', '$interest'] },
              },
            },
            {
              $group: {
                _id: { eventId: '$eventId', response: '$response' },
                count: { $sum: 1 },
              },
            },
          ])
          .exec(),
        this.responseModel
          .find({ eventId: { $in: eventIds }, userId: actor.sub })
          .lean()
          .exec(),
      ]);
    const neighborhoodMap = new Map<
      string,
      { id: string; name: string; city?: string }
    >();
    for (const item of neighborhoods) {
      const projection = {
        id: String(item._id),
        name: item.name,
        city: item.city,
      };
      neighborhoodMap.set(String(item._id), projection);
      if (item.slug) neighborhoodMap.set(item.slug, projection);
    }
    const countMap = new Map<string, Record<string, number>>();
    for (const entry of groupedResponses) {
      const counts = countMap.get(entry._id.eventId) ?? {};
      counts[entry._id.response] = entry.count;
      countMap.set(entry._id.eventId, counts);
    }
    const viewerMap = new Map(
      viewerResponses.map((item) => [
        item.eventId,
        normalizeEventResponseRecord(item),
      ]),
    );
    return rows.map((row) =>
      this.present(
        row,
        actor,
        profiles.get(row.organizerId) ?? null,
        neighborhoodMap.get(row.neighborhoodId) ?? null,
        countMap.get(String(row._id)) ?? {},
        viewerMap.get(String(row._id)) ?? null,
        admin,
      ),
    );
  }

  private async presentOne(row: EventRow, actor: EventActor, admin = false) {
    return (await this.presentMany([row], actor, admin))[0];
  }

  private present(
    row: EventRow,
    actor: EventActor,
    organizer: unknown,
    neighborhood: unknown,
    counts: Record<string, number>,
    viewerResponse: ReturnType<typeof normalizeEventResponseRecord> | null,
    admin: boolean,
  ) {
    const normalized = normalizeEventRecord(row);
    const participantCount =
      row.participantCount ?? counts[EventResponseStatus.GOING] ?? 0;
    const waitlistCount =
      row.waitlistCount ?? counts[EventResponseStatus.WAITLISTED] ?? 0;
    const capacity = row.capacity ?? null;
    const now = Date.now();
    const registrationOpen =
      RESPONDABLE_STATUSES.includes(row.status) &&
      row.startsAt.getTime() > now &&
      (!row.registrationDeadline || row.registrationDeadline.getTime() > now);
    const isOrganizer = row.organizerId === actor.sub;
    const privileged = [Role.ADMIN, Role.MODERATOR].includes(actor.role);
    const sameNeighborhood = row.neighborhoodId === actor.neighborhoodId;
    const hasActiveResponse =
      viewerResponse && ACTIVE_RESPONSES.includes(viewerResponse.response);
    return {
      ...normalized,
      organizer,
      neighborhood,
      counts: {
        interested: counts[EventResponseStatus.INTERESTED] ?? 0,
        participants: participantCount,
        maybe: counts[EventResponseStatus.MAYBE] ?? 0,
        waitlisted: waitlistCount,
        remainingPlaces:
          capacity === null ? null : Math.max(0, capacity - participantCount),
      },
      viewerResponse,
      registrationClosed: !registrationOpen,
      isFull: capacity !== null && participantCount >= capacity,
      nextAction: this.eventNextAction(
        row,
        actor,
        viewerResponse?.response ?? null,
      ),
      permissions: {
        canEdit:
          (isOrganizer || privileged) &&
          (row.status === EventStatus.DRAFT || registrationOpen),
        canPublish:
          (isOrganizer || privileged) &&
          row.status === EventStatus.DRAFT &&
          row.startsAt.getTime() > now,
        canCancel:
          (isOrganizer || privileged) &&
          ![
            EventStatus.CANCELLED,
            EventStatus.COMPLETED,
            EventStatus.ARCHIVED,
          ].includes(row.status),
        canRespond: sameNeighborhood && !isOrganizer && registrationOpen,
        canJoin:
          sameNeighborhood &&
          !isOrganizer &&
          registrationOpen &&
          viewerResponse?.response !== EventResponseStatus.GOING,
        canLeave:
          sameNeighborhood && Boolean(hasActiveResponse) && registrationOpen,
        canViewParticipants: isOrganizer || privileged,
        canComplete:
          (isOrganizer || privileged) &&
          (row.status === EventStatus.STARTED ||
            Boolean(row.endsAt && row.endsAt.getTime() <= now)),
        canArchive:
          (isOrganizer || privileged) &&
          [EventStatus.COMPLETED, EventStatus.CANCELLED].includes(row.status),
      },
      ...(admin ? { history: row.history ?? [] } : {}),
    };
  }

  private eventNextAction(
    row: EventRow,
    actor: EventActor,
    response: EventResponseStatus | null,
  ) {
    if (row.organizerId === actor.sub && row.status === EventStatus.DRAFT)
      return 'publish';
    if (response === EventResponseStatus.WAITLISTED) return 'wait';
    if (response === EventResponseStatus.GOING) return 'attend';
    if (RESPONDABLE_STATUSES.includes(row.status)) return 'respond';
    return null;
  }

  private async findDocument(id: string, includePrivate = false) {
    const query = this.eventModel.findById(id);
    if (includePrivate) query.select('+waitlistSequence +countersInitialized');
    const event = await query.exec();
    if (!event) throw new NotFoundException('Événement introuvable.');
    return event;
  }

  private assertCanCreate(dto: CreateEventDto, actor: EventActor) {
    if (
      actor.role === Role.RESIDENT &&
      dto.neighborhoodId !== actor.neighborhoodId
    ) {
      throw new ForbiddenException(
        'Vous pouvez créer un événement uniquement dans votre quartier.',
      );
    }
    if (
      dto.category === EventCategory.EMERGENCY &&
      actor.role === Role.RESIDENT
    ) {
      throw new ForbiddenException(
        'Les événements d’urgence sont réservés à la modération.',
      );
    }
    if (dto.status && dto.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Un événement est d’abord enregistré comme brouillon.',
      );
    }
  }

  private assertCanView(
    event: EventDocument,
    actor: EventActor,
    admin: boolean,
  ) {
    if (admin || [Role.ADMIN, Role.MODERATOR].includes(actor.role)) return;
    if (event.neighborhoodId !== actor.neighborhoodId)
      throw new NotFoundException('Événement introuvable.');
    if (event.status === EventStatus.DRAFT && event.organizerId !== actor.sub) {
      throw new NotFoundException('Événement introuvable.');
    }
  }

  private assertOrganizerOrAdmin(event: EventDocument, actor: EventActor) {
    if (
      event.organizerId === actor.sub ||
      [Role.ADMIN, Role.MODERATOR].includes(actor.role)
    )
      return;
    throw new ForbiddenException(
      'Seul l’organisateur peut gérer cet événement.',
    );
  }

  private assertCanRespond(event: EventDocument, actor: EventActor) {
    this.assertCanView(event, actor, false);
    if (event.organizerId === actor.sub) {
      throw new ForbiddenException(
        'L’organisateur ne peut pas s’inscrire à son propre événement.',
      );
    }
    if (!RESPONDABLE_STATUSES.includes(event.status)) {
      throw new ConflictException('Cet événement n’accepte plus de réponse.');
    }
    const now = Date.now();
    if (
      event.startsAt.getTime() <= now ||
      (event.registrationDeadline &&
        event.registrationDeadline.getTime() <= now)
    ) {
      throw new ConflictException(
        'Les inscriptions à cet événement sont closes.',
      );
    }
  }

  private async resolveActiveNeighborhoodId(identifier: string) {
    const filters: Array<Record<string, unknown>> = [{ slug: identifier }];
    if (isValidObjectId(identifier)) filters.push({ _id: identifier });
    const neighborhood = await this.neighborhoodModel
      .findOne({
        $and: [
          { $or: filters },
          {
            status: { $ne: NeighborhoodStatus.ARCHIVED },
            isActive: { $ne: false },
          },
        ],
      })
      .select('_id slug')
      .lean<{ _id: unknown; slug?: string } | null>()
      .exec();
    if (!neighborhood) {
      throw new BadRequestException(
        'Le quartier sélectionné est introuvable ou archivé.',
      );
    }
    return neighborhood.slug || String(neighborhood._id);
  }

  private async resolveResidentNeighborhood(
    actor: EventActor,
    requestedNeighborhoodId: string,
  ) {
    if (!actor.neighborhoodId) {
      throw new ConflictException(
        'Vous devez être rattaché à un quartier pour créer un événement.',
      );
    }
    const actorNeighborhoodId = await this.resolveActiveNeighborhoodId(
      actor.neighborhoodId,
    );
    if (requestedNeighborhoodId !== actorNeighborhoodId) {
      throw new ForbiddenException(
        'Vous pouvez créer un événement uniquement dans votre quartier.',
      );
    }
    return actorNeighborhoodId;
  }

  private async assertActiveResidentNeighborhood(actor: EventActor) {
    if (actor.role !== Role.RESIDENT) return;
    if (!actor.neighborhoodId) {
      throw new ConflictException(
        'Vous devez être rattaché à un quartier pour participer.',
      );
    }
    await this.resolveActiveNeighborhoodId(actor.neighborhoodId);
  }

  private validateDates(
    startsAt: Date,
    endsAt?: Date,
    deadline?: Date,
    publishing = false,
  ) {
    const start = new Date(startsAt);
    const end = endsAt
      ? new Date(endsAt)
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const registrationDeadline = deadline ? new Date(deadline) : null;
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('La fin doit être postérieure au début.');
    }
    if (
      registrationDeadline &&
      registrationDeadline.getTime() > start.getTime()
    ) {
      throw new BadRequestException(
        'La clôture des inscriptions doit précéder le début.',
      );
    }
    if (publishing && end.getTime() <= Date.now()) {
      throw new ConflictException(
        'Un événement terminé ne peut pas être publié.',
      );
    }
    return { startsAt: start, endsAt: end, registrationDeadline };
  }

  private async ensureCounters(event: EventDocument) {
    if (event.countersInitialized) return;
    const grouped = await this.responseModel
      .aggregate<{
        _id: string;
        count: number;
      }>([
        { $match: { eventId: String(event._id) } },
        { $project: { response: { $ifNull: ['$response', '$interest'] } } },
        { $match: { response: { $in: ACTIVE_RESPONSES } } },
        { $group: { _id: '$response', count: { $sum: 1 } } },
      ])
      .exec();
    const counts = new Map(grouped.map((item) => [item._id, item.count]));
    await this.eventModel
      .updateOne(
        {
          _id: event._id,
          $or: [
            { countersInitialized: false },
            { countersInitialized: { $exists: false } },
          ],
        },
        {
          $set: {
            participantCount: counts.get(EventResponseStatus.GOING) ?? 0,
            waitlistCount: counts.get(EventResponseStatus.WAITLISTED) ?? 0,
            countersInitialized: true,
          },
        },
      )
      .exec();
  }

  private async claimSeat(eventId: string) {
    const now = new Date();
    const event = await this.eventModel
      .findOneAndUpdate(
        {
          _id: eventId,
          status: { $in: RESPONDABLE_STATUSES },
          startsAt: { $gt: now },
          $and: [
            {
              $or: [
                { registrationDeadline: null },
                { registrationDeadline: { $gt: now } },
                { registrationDeadline: { $exists: false } },
              ],
            },
            {
              $or: [
                { capacity: null },
                { capacity: { $exists: false } },
                { $expr: { $lt: ['$participantCount', '$capacity'] } },
              ],
            },
          ],
        },
        { $inc: { participantCount: 1 } },
        { returnDocument: 'after' },
      )
      .exec();
    return Boolean(event);
  }

  private async claimWaitlistPosition(eventId: string) {
    const now = new Date();
    const event = await this.eventModel
      .findOneAndUpdate(
        {
          _id: eventId,
          status: { $in: RESPONDABLE_STATUSES },
          startsAt: { $gt: now },
          $or: [
            { registrationDeadline: null },
            { registrationDeadline: { $gt: now } },
            { registrationDeadline: { $exists: false } },
          ],
        },
        {
          $inc: { waitlistSequence: 1, waitlistCount: 1 },
          $set: { status: EventStatus.FULL },
        },
        { returnDocument: 'after' },
      )
      .select('+waitlistSequence')
      .exec();
    if (!event)
      throw new ConflictException(
        'Les inscriptions à cet événement sont closes.',
      );
    return event.waitlistSequence;
  }

  private async writeClaimedResponse(
    eventId: string,
    userId: string,
    claim: string,
    response: EventResponseStatus,
    waitlistPosition: number | null,
  ) {
    const updated = await this.responseModel
      .findOneAndUpdate(
        { eventId, userId, mutationClaim: claim },
        {
          $set: {
            response,
            waitlistPosition,
            respondedAt: new Date(),
            mutationClaim: null,
            mutationClaimedAt: null,
          },
          $unset: { interest: 1 },
          $inc: { revision: 1 },
        },
        { returnDocument: 'after' },
      )
      .exec();
    if (!updated)
      throw new ConflictException('La réponse a changé. Réessayez.');
  }

  private async removeWaitlistCount(eventId: string) {
    await this.eventModel
      .updateOne(
        { _id: eventId, waitlistCount: { $gt: 0 } },
        { $inc: { waitlistCount: -1 } },
      )
      .exec();
  }

  private async promoteOldestWaitlisted(eventId: string) {
    const now = new Date();
    const event = await this.eventModel
      .findOne({
        _id: eventId,
        status: { $in: RESPONDABLE_STATUSES },
        startsAt: { $gt: now },
        $or: [
          { registrationDeadline: null },
          { registrationDeadline: { $gt: now } },
          { registrationDeadline: { $exists: false } },
        ],
      })
      .exec();
    if (!event) return;
    const claim = randomUUID();
    const candidate = await this.responseModel
      .findOneAndUpdate(
        {
          eventId,
          response: EventResponseStatus.WAITLISTED,
          $or: [{ mutationClaim: null }, { mutationClaim: { $exists: false } }],
        },
        { $set: { mutationClaim: claim, mutationClaimedAt: now } },
        { sort: { respondedAt: 1, _id: 1 }, returnDocument: 'after' },
      )
      .exec();
    if (!candidate) return;
    const seated = await this.claimSeat(eventId);
    if (!seated) {
      await this.responseModel
        .updateOne(
          { _id: candidate._id, mutationClaim: claim },
          { $set: { mutationClaim: null, mutationClaimedAt: null } },
        )
        .exec();
      return;
    }
    await this.eventModel
      .updateOne(
        { _id: eventId, waitlistCount: { $gt: 0 } },
        { $inc: { waitlistCount: -1 }, $set: { status: EventStatus.FULL } },
      )
      .exec();
    await this.responseModel
      .updateOne(
        { _id: candidate._id, mutationClaim: claim },
        {
          $set: {
            response: EventResponseStatus.GOING,
            waitlistPosition: null,
            promotedAt: now,
            mutationClaim: null,
            mutationClaimedAt: null,
          },
          $inc: { revision: 1 },
          $unset: { interest: 1 },
        },
      )
      .exec();
  }

  private regex(value: string) {
    return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  private isDuplicateKey(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }

  private async ensureResponseUniqueIndex() {
    try {
      const indexes = await this.responseModel.collection.indexes();
      const existing = indexes.find(
        (index) => index.key?.eventId === 1 && index.key?.userId === 1,
      );
      if (existing?.unique) return;
      if (existing) {
        this.logger.error(
          'Index EventResponse eventId+userId présent sans unicité; aucune modification automatique.',
        );
        return;
      }
      await this.responseModel.collection.createIndex(
        { eventId: 1, userId: 1 },
        {
          unique: true,
          partialFilterExpression: {
            eventId: { $type: 'string' },
            userId: { $type: 'string' },
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Impossible de vérifier ou créer l’index unique EventResponse: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
