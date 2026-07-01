import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateEventDto } from './dto/create-event.dto';
import { RespondEventDto } from './dto/respond-event.dto';
import {
  EventResponse,
  EventResponseDocument,
} from './schemas/event-response.schema';
import {
  EventDocument,
  EventStatus,
  NeighborhoodEvent,
} from './schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(NeighborhoodEvent.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventResponse.name)
    private readonly responseModel: Model<EventResponseDocument>,
  ) {}

  async create(dto: CreateEventDto, organizerId: string) {
    return this.eventModel.create({
      ...dto,
      organizerId,
      status: EventStatus.SCHEDULED,
    });
  }

  async findAll(neighborhoodId?: string) {
    const filter = neighborhoodId
      ? { neighborhoodId, status: EventStatus.SCHEDULED }
      : { status: EventStatus.SCHEDULED };

    return this.eventModel.find(filter).sort({ startsAt: 1 }).exec();
  }

  async findOne(id: string) {
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Événement ${id} introuvable`);
    }

    return event;
  }

  async respond(id: string, userId: string, dto: RespondEventDto) {
    await this.findOne(id);

    return this.responseModel
      .findOneAndUpdate(
        { eventId: id, userId },
        { eventId: id, userId, interest: dto.interest },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async findMyResponses(userId: string) {
    return this.responseModel.find({ userId }).sort({ updatedAt: -1 }).exec();
  }

  async recommend(user: { sub: string; neighborhoodId: string }) {
    const positiveResponses = await this.responseModel
      .find({ userId: user.sub, interest: { $in: ['interested', 'going'] } })
      .exec();

    const eventIds = positiveResponses.map((response) => response.eventId);
    const previousEvents =
      eventIds.length > 0
        ? await this.eventModel.find({ _id: { $in: eventIds } }).exec()
        : [];

    const preferredCategories = new Set(
      previousEvents.map((event) => event.category),
    );

    const candidates = await this.eventModel
      .find({
        neighborhoodId: user.neighborhoodId,
        status: EventStatus.SCHEDULED,
      })
      .sort({ startsAt: 1 })
      .exec();

    return candidates
      .map((event) => ({
        event,
        score: preferredCategories.has(event.category) ? 2 : 1,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
}
